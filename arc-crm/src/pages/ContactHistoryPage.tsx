import React, { useEffect, useState } from 'react';
import '../styles/container.css';
import '../styles/form.css';
import '../styles/nav.css';
import '../styles/page.css';
import '../styles/table.css';
import Navbar from './components/Navbar';
import {useNavigate} from "react-router-dom";

interface Contact {
    contactId: number;
    dealId: number;
    companyId: number;
    companyUserId: number;
    userName: string;
    contactType: string;
    contactResult: string;
    contactAt: string;
    contactPercentage: number;
}

interface ContactDetails extends Contact {
    contactMemo: string;
    updatedAt: string;
}

type SortKey = keyof Contact;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function ContactHistoryPage() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchCompanyName, setSearchCompanyName] = useState('');
    const [searchCompanyUserName, setSearchCompanyUserName] = useState('');
    const [searchUserName, setSearchUserName] = useState('');
    const [searchDealName, setSearchDealName] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [contactHistoryDetail, setContactHistoryDetail] = useState<ContactDetails | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const initialContactState = {
        dealId: '',
        companyId: '',
        companyUserId: '',
        userId: '',
        contactType: 'EMAIL',
        contactResult: 'REFUSE',
        contactAt: '',
        contactPercentage: 0,
        contactMemo: '',
    };
    const [newContact, setNewContact] = useState(initialContactState);

    const toggleSort = (key: SortKey) => {
        setSortState((prev) => {
            const existing = prev.find((s) => s.key === key);
            const nextOrder = !existing || existing.order === 'desc' ? 'asc' : 'desc';
            if (existing) {
                return prev.map((s) => s.key === key ? { key, order: nextOrder } : s);
            }
            return [...prev, { key, order: nextOrder }];
        });
    };

    const getSortIcon = (key: SortKey) => {
        const state = sortState.find((s) => s.key === key);
        return state ? (state.order === 'asc' ? ' ▲' : ' ▼') : '';
    };

    const multiSort = (list: Contact[]) => {
        if (!Array.isArray(list) || sortState.length === 0) return list;
        return [...list].sort((a, b) => {
            for (const { key, order } of sortState) {
                const aVal = a[key];
                const bVal = b[key];
                const cmp = typeof aVal === 'number' && typeof bVal === 'number'
                    ? aVal - bVal
                    : aVal.toString().localeCompare(bVal.toString(), undefined, { sensitivity: 'base' });
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    };

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/contact?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('컨택 이력을 불러오는데 실패했습니다.');
            const data = await response.json();
            setContacts(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactHIstoryDetails = async (contactId: number) => {
        setDetailLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/contact/contactDetails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactId: contactId }),
            });
            if (!response.ok) throw new Error('상세 정보를 불러오는데 실패했습니다.');
            const data = await response.json();
            const fullDetail = { ...selectedContact!, ...data };
            setContactHistoryDetail(fullDetail);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    }

    const searchContacts = async () => {
        const noSearch = !searchCompanyName.trim() && !searchCompanyUserName.trim() && !searchUserName.trim() && !searchDealName.trim();
        if (noSearch) {
            setSearchMode(false);
            await fetchContacts();
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCompanyName) params.append('companyName', searchCompanyName);
            if (searchCompanyUserName) params.append('companyUserName', searchCompanyUserName);
            if (searchUserName) params.append('userName', searchUserName);
            if (searchDealName) params.append('dealName', searchDealName);
            params.append('page', page.toString());

            const token = localStorage.getItem('token');
            const response = await fetch(`/contact/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('검색 실패');
            const data = await response.json();
            setContacts(data.content);
            setTotalPages(data.totalPages);
            setSearchMode(true);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const addContact = async (contactData: {
        dealId: number;
        companyId: number;
        companyUserId: number;
        userId: string;
        contactType: string;
        contactResult: string;
        contactAt: string;
        contactPercentage: number;
        contactMemo: string;
    }) => {
        if (!contactData.dealId || isNaN(contactData.dealId)) { return setError('영업 ID는 필수입니다.'); }
        if (!contactData.companyId || isNaN(contactData.companyId)) { return setError('고객사 ID는 필수입니다.'); }
        if (!contactData.companyUserId || isNaN(contactData.companyUserId)) { return setError('고객사 사원 ID는 필수입니다.'); }
        if (!contactData.userId.trim()) { return setError('담당자 ID는 필수입니다.'); }
        if (!contactData.contactAt.trim()) { return setError('컨택 일자는 필수입니다.'); }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/contact', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...contactData,
                    contactType: newContact.contactType,
                    contactResult: newContact.contactResult,
                }),
            });

            if (!response.ok) throw new Error('컨택 이력 등록에 실패했습니다.');

            alert('컨택 이력 등록에 성공했습니다.');
            await fetchContacts();
            setShowAddForm(false);
            setNewContact(initialContactState);
            setError(null);
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchMode) searchContacts();
        else fetchContacts();
    }, [page]);

    const sorted = multiSort(contacts);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout}/>
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input placeholder="고객사명 검색" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <input placeholder="고객사 사원명 검색" value={searchCompanyUserName} onChange={(e) => setSearchCompanyUserName(e.target.value)} />
                    <input placeholder="담당자명 검색" value={searchUserName} onChange={(e) => setSearchUserName(e.target.value)} />
                    <input placeholder="영업명 검색" value={searchDealName} onChange={(e) => setSearchDealName(e.target.value)} />
                    <button type="button" onClick={() => { setPage(0); searchContacts(); }}>검색하기</button>
                    <button type="button" onClick={() => setShowAddForm(true)}>컨택 이력 등록</button>
                </div>

                {showAddForm && (
                    <div className="overlay">
                        <div className="container">
                            <h3>컨택 이력 등록</h3>
                                <div className="form-row"><label>*영업 ID</label><input type="number" value={newContact.dealId} onChange={(e) => setNewContact({ ...newContact, dealId: e.target.value })} /></div>
                                <div className="form-row"><label>*고객사 ID</label><input type="number" value={newContact.companyId} onChange={(e) => setNewContact({ ...newContact, companyId: e.target.value })} /></div>
                                <div className="form-row"><label>*고객사원 ID</label><input type="number" value={newContact.companyUserId} onChange={(e) => setNewContact({ ...newContact, companyUserId: e.target.value })} /></div>
                                <div className="form-row"><label>*담당자 ID</label><input type="text" value={newContact.userId} onChange={(e) => setNewContact({ ...newContact, userId: e.target.value })} /></div>
                                <div className="form-row"><label>*컨택 유형</label>
                                    <select value={newContact.contactType} onChange={(e) => setNewContact({ ...newContact, contactType: e.target.value })}>
                                        <option value="EMAIL">EMAIL</option>
                                        <option value="CALL">CALL</option>
                                        <option value="MEETING">MEETING</option>
                                    </select>
                                </div>
                                <div className="form-row"><label>*컨택 결과</label>
                                    <select value={newContact.contactResult} onChange={(e) => setNewContact({ ...newContact, contactResult: e.target.value })}>
                                        <option value="REFUSE">REFUSE</option>
                                        <option value="PROGRESS">PROGRESS</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="COMPLETE">COMPLETE</option>
                                    </select>
                                </div>
                                <div className="form-row"><label>*컨택 일자</label><input type="date" value={newContact.contactAt} onChange={(e) => setNewContact({ ...newContact, contactAt: e.target.value })} /></div>
                                <div className="form-row">
                                    <label>*진행률(%)</label>
                                    <input type="number" min={0} max={100} value={newContact.contactPercentage}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value, 10);
                                            if (value >= 0 && value <= 100) {
                                                setNewContact({ ...newContact, contactPercentage: value });
                                            } else if (e.target.value === '') {
                                                setNewContact({ ...newContact, contactPercentage: 0 });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="form-row"><label>메모</label><input type="text" value={newContact.contactMemo} onChange={(e) => setNewContact({...newContact, contactMemo: e.target.value})} /></div>
                                <div className="form-row">
                                    <button type="button" className="nav-button" onClick={() => {
                                        addContact({
                                            ...newContact,
                                            dealId: parseInt(newContact.dealId, 10) || 0,
                                            companyId: parseInt(newContact.companyId, 10) || 0,
                                            companyUserId: parseInt(newContact.companyUserId, 10) || 0,
                                        });
                                    }}
                                    > 등록
                                    </button>
                                    <button type="button" onClick={() => setShowAddForm(false)} className="nav-button">취소</button>
                                </div>

                        </div>
                    </div>
                )}

                {/* Table */}
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <table className="table">
                        <thead>
                        <tr>
                            <th><button onClick={() => toggleSort('contactId')}>컨택 ID{getSortIcon('contactId')}</button></th>
                            <th><button onClick={() => toggleSort('userName')}>담당자{getSortIcon('userName')}</button></th>
                            <th><button onClick={() => toggleSort('contactType')}>유형{getSortIcon('contactType')}</button></th>
                            <th><button onClick={() => toggleSort('contactResult')}>결과{getSortIcon('contactResult')}</button></th>
                            <th><button onClick={() => toggleSort('contactPercentage')}>진행률{getSortIcon('contactPercentage')}</button></th>
                            <th><button onClick={() => toggleSort('contactAt')}>컨택 일자{getSortIcon('contactAt')}</button></th>
                        </tr>
                        </thead>
                        <tbody>
                        {sorted.map((c) => (
                            <tr key={c.contactId} className="open-slide-panel"
                                onClick={() => {
                                    setSelectedContact(c);
                                    fetchContactHIstoryDetails(c.contactId);
                                }}
                            >
                                <td>{c.contactId}</td>
                                <td>{c.userName}</td>
                                <td>{c.contactType}</td>
                                <td>{c.contactResult}</td>
                                <td>{c.contactPercentage}</td>
                                <td>{new Date(c.contactAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ marginTop: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="page-button"
                >
                    &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
                        return (
                            <button
                                key={`page-${i}`}
                                onClick={() => setPage(i)}
                                className={`page-button ${page === i ? 'active' : ''}`}
                            >
                                {i + 1}
                            </button>
                        );
                    }

                    if (
                        (i === 1 && page > 3) ||
                        (i === totalPages - 2 && page < totalPages - 4) ||
                        (Math.abs(i - page) === 2)
                    ) {
                        return <span key={`dots-${i}`} className="page-dots">...</span>;
                    }

                    return <React.Fragment key={`empty-${i}`} />;
                })}

                <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={page === totalPages - 1}
                    className="page-button"
                >
                    &gt;
                </button>
            </div>

            { /* slide-panel */}
            {selectedContact && contactHistoryDetail && (
                <>
                    <div className="slide-overlay" onClick={() => setSelectedContact(null)}></div>
                    <div className={`slide-panel ${selectedContact && contactHistoryDetail ? 'open' : ''}`}>
                        <button className="slide-close-button" onClick={() => setSelectedContact(null)}>×</button>
                        {detailLoading ? (
                            <p>로딩 중...</p>
                        ) : (
                            <div className="container">
                                <h3>컨택 이력 상세 정보</h3>
                                <div className="form-row"><label>컨택 ID</label><span>{selectedContact.contactId}</span></div>
                                <div className="form-row"><label>영업 ID</label><span>{contactHistoryDetail.dealId}</span></div>
                                <div className="form-row"><label>고객사 ID</label><span>{contactHistoryDetail.companyId}</span></div>
                                <div className="form-row"><label>고객사원 ID</label><span>{contactHistoryDetail.companyUserId}</span></div>
                                <div className="form-row"><label>담당자</label><span>{contactHistoryDetail.userName}</span></div>
                                <div className="form-row"><label>컨택 유형</label><span>{contactHistoryDetail.contactType}</span></div>
                                <div className="form-row"><label>컨택 결과</label><span>{contactHistoryDetail.contactResult}</span></div>
                                <div className="form-row"><label>진행률 (%)</label><span>{contactHistoryDetail.contactPercentage}</span></div>
                                <div className="form-row"><label>컨택 일자</label><span>{new Date(contactHistoryDetail.contactAt).toLocaleDateString()}</span></div>
                                <div className="form-row"><label>메모</label><span>{contactHistoryDetail.contactMemo || '-'}</span></div>
                                <div className="form-row"><label>수정일</label><span>{new Date(contactHistoryDetail.updatedAt).toLocaleString()}</span></div>
                                {/* <button className="nav-button" onClick={() => setEditMode(true)}>수정하기</button> */}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ContactHistoryPage;