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
    userId: string;
    updatedAt: string;
}

type SortKey = keyof Contact;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function ContactHistoryPage() {
    const navigate = useNavigate();
    const [contactHistory, setContactHistory] = useState<Contact[]>([]);
    const [searchCompanyName, setSearchCompanyName] = useState('');
    const [searchCompanyUserName, setSearchCompanyUserName] = useState('');
    const [searchUserName, setSearchUserName] = useState('');
    const [searchDealName, setSearchDealName] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [sortState, setSortState] = useState<SortState>({
        key: 'contactAt',
        order: 'desc',
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [contactHistoryDetail, setContactHistoryDetail] = useState<ContactDetails | null>(null);
    const [editMode, setEditMode] = useState(false);

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
        contactAt: new Date().toISOString().slice(0, 10),
        contactPercentage: 50,
        contactMemo: '',
    };
    const [newContact, setNewContact] = useState(initialContactState);

    const toggleSort = (key: SortKey) => {
        setSortState((prev) => {
            if (prev && prev.key === key) {
                return { key, order: prev.order === 'asc' ? 'desc' : 'asc' };
            }
            return { key, order: 'asc' };
        });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortState || sortState.key !== key) return '';
        return sortState.order === 'asc' ? ' ▲' : ' ▼';
    };

    const Sort = (list: Contact[]) => {
        if (!sortState) return list;

        const { key, order } = sortState;
        return [...list].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                const diff = aVal - bVal;
                return order === 'asc' ? diff : -diff;
            } else {
                const cmp = aVal.toString().localeCompare(bVal.toString(), undefined, { sensitivity: 'base' });
                return order === 'asc' ? cmp : -cmp;
            }
        });
    };

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/contact?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('컨택 이력 조회 실패');

            const data = await response.json();
            setContactHistory(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactHistoryDetails = async (contactId: number) => {
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
                body: JSON.stringify({ contactId }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '컨택 이력 상세정보 조회 실패');
            }

            const data = await response.json();
            setContactHistoryDetail(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchContacts = async () => {
        const noSearch = !searchCompanyName.trim() && !searchCompanyUserName.trim() && !searchUserName.trim() && !searchDealName.trim();
        if (noSearch) {
            setSearchMode(false);
            await fetchContacts();
            return;
        }

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

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '검색 실패');
            }

            const data = await response.json();
            setContactHistory(data.content);
            setTotalPages(data.totalPages);
            setSearchMode(true);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
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
        if (!contactData.dealId || isNaN(contactData.dealId)) { return setError('영업 ID 필수'); }
        if (!contactData.companyId || isNaN(contactData.companyId)) { return setError('고객사 ID 필수'); }
        if (!contactData.companyUserId || isNaN(contactData.companyUserId)) { return setError('고객사 사원 ID 필수'); }
        if (!contactData.userId.trim()) { return setError('담당자 ID 필수'); }
        if (!contactData.contactAt.trim()) { return setError('컨택 일자 필수'); }

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

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '컨택 이력 등록 실패');
            }

            alert('컨택 이력 등록 성공');
            await fetchContacts();
            setShowAddForm(false);
            setNewContact(initialContactState);
            setError(null);
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleContactHistoryUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactHistoryDetail) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/contact', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...contactHistoryDetail,
                    contactId: selectedContact!.contactId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '컨택 이력 상세정보 수정 실패');
            }

            await fetchContacts();
            await fetchContactHistoryDetails(selectedContact!.contactId);
            setEditMode(false);
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleDelete = async () => {
        if (!contactHistoryDetail) return;

        const confirmDelete = window.confirm('정말 컨택 이력을 삭제하시겠습니까?');
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/contact', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactId: selectedContact!.contactId,
                })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '컨택 이력 삭제 실패');
            }

            alert('컨택 이력이 삭제 성공');
            setSelectedContact(null);
            setContactHistoryDetail(null);
            setEditMode(false);
            await fetchContacts();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    useEffect(() => {
        if (searchMode) searchContacts();
        else fetchContacts();
    }, [page]);

    const sorted = Sort(contactHistory);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout}/>
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input placeholder="고객사명" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <input placeholder="고객사 사원명" value={searchCompanyUserName} onChange={(e) => setSearchCompanyUserName(e.target.value)} />
                    <input placeholder="담당자명" value={searchUserName} onChange={(e) => setSearchUserName(e.target.value)} />
                    <input placeholder="영업명" value={searchDealName} onChange={(e) => setSearchDealName(e.target.value)} />
                    <button type="button" onClick={() => { setPage(0); searchContacts(); }}>검색</button>
                    <button type="button" onClick={() => setShowAddForm(true)}>컨택 이력 등록</button>
                </div>

                {showAddForm && (
                    <div className="overlay">
                        <div className="container">
                            <h3>컨택 이력 등록</h3>
                                <div className="form-row"><label>*영업 ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={newContact.dealId} onChange={(e) => setNewContact({ ...newContact, dealId: e.target.value.replace(/\D/g, '') })} /></div>
                                <div className="form-row"><label>*고객사 ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={newContact.companyId} onChange={(e) => setNewContact({ ...newContact, companyId: e.target.value.replace(/\D/g, '') })} /></div>
                                <div className="form-row"><label>*고객사원 ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={newContact.companyUserId} onChange={(e) => setNewContact({ ...newContact, companyUserId: e.target.value.replace(/\D/g, '') })} /></div>
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
                                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={newContact.contactPercentage}
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
                                <div className="form-row"><label>메모</label><input type="text" placeholder="최대 30자" value={newContact.contactMemo} onChange={(e) => setNewContact({...newContact, contactMemo: e.target.value})} /></div>
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
                                    <button type="button" className="nav-button" onClick={() => { setShowAddForm(false); setNewContact(initialContactState); }} >취소</button>
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
                        {sorted.map((contact) => (
                            <tr key={contact.contactId}
                                className={`open-slide-panel ${selectedContact?.contactId === contact.contactId ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedContact(contact);
                                    fetchContactHistoryDetails(contact.contactId);
                                }}
                            >
                                <td>{contact.contactId}</td>
                                <td>{contact.userName}</td>
                                <td>{contact.contactType}</td>
                                <td>{contact.contactResult}</td>
                                <td>{contact.contactPercentage}</td>
                                <td>{new Date(contact.contactAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="pagination">
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
                    <div className="slide-overlay" onClick={() => { setSelectedContact(null); setEditMode(false);}} ></div>
                    <div className={`slide-panel ${selectedContact && contactHistoryDetail ? 'open' : ''}`}>
                        <button className="slide-close-button" onClick={() => { setSelectedContact(null); setEditMode(false); }}>×</button>
                        {detailLoading ? (
                            <p>로딩 중...</p>
                        ) : editMode ? (
                            <div className="container">
                                <form onSubmit={handleContactHistoryUpdate}>
                                    <h3>컨택 이력 상세정보 수정</h3>
                                    <div className="form-row"><label>컨택 ID</label><span>{selectedContact.contactId}</span></div>
                                    <div className="form-row"><label>영업 ID</label><span>{contactHistoryDetail.dealId}</span></div>
                                    <div className="form-row"><label>고객사 ID</label><span>{contactHistoryDetail.companyId}</span></div>
                                    <div className="form-row"><label>고객사원 ID</label><span>{contactHistoryDetail.companyUserId}</span></div>
                                    <div className="form-row"><label>담당자 ID</label><input type="text" value={contactHistoryDetail.userId} onChange={(e) => setContactHistoryDetail({ ...contactHistoryDetail, userId: e.target.value })} /></div>
                                    <div className="form-row">
                                        <label>컨택 유형</label>
                                        <select value={contactHistoryDetail.contactType} onChange={(e) => setContactHistoryDetail({ ...contactHistoryDetail, contactType: e.target.value })}>
                                            <option value="EMAIL">EMAIL</option>
                                            <option value="CALL">CALL</option>
                                            <option value="MEETING">MEETING</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label>컨택 결과</label>
                                        <select value={contactHistoryDetail.contactResult} onChange={(e) => setContactHistoryDetail({ ...contactHistoryDetail, contactResult: e.target.value })}>
                                            <option value="REFUSE">REFUSE</option>
                                            <option value="PROGRESS">PROGRESS</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="COMPLETE">COMPLETE</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label>진행률 (%)</label><input type="text" inputMode="numeric" pattern="[0-9]*"
                                            value={contactHistoryDetail.contactPercentage}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);
                                                if (!isNaN(value) && value >= 0 && value <= 100) {
                                                    setContactHistoryDetail({ ...contactHistoryDetail, contactPercentage: value });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>컨택 일자</label>
                                        <input
                                            type="date"
                                            value={contactHistoryDetail.contactAt.slice(0, 10)}
                                            onChange={(e) =>
                                                setContactHistoryDetail({ ...contactHistoryDetail, contactAt: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>메모</label>
                                        <input type="text" placeholder="최대 30자" value={contactHistoryDetail.contactMemo} onChange={(e) => setContactHistoryDetail({ ...contactHistoryDetail, contactMemo: e.target.value })}/>
                                    </div>
                                    <div className="form-row">
                                        <button type="submit" className="nav-button">저장</button>
                                        <button type="button" className="nav-button"
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setContactHistoryDetail(null);
                                                }}
                                        >취소
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="container">
                                <h3>컨택 이력 상세정보</h3>
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
                                <button type="button" className="nav-button" onClick={() => setEditMode(true)}>수정</button>
                                <div className="container-delete">
                                    <span onClick={() => {handleDelete();}}>컨택 이력 삭제</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ContactHistoryPage;