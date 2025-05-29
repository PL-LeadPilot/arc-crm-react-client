import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/container.css';
import '../styles/form.css';
import '../styles/nav.css';
import '../styles/page.css';
import '../styles/table.css';
import '../styles/slide-page.css';
import Navbar from "./components/Navbar";

interface Deal {
    dealId: number;
    dealName: string;
    companyId: number;
    companyUserId: number;
    userName: string;
    sourceType: string;
    statusType: string;
    dealAt: string;
}

interface DealDetails extends Deal {
    updatedAt: string;
    userId: string;
}

interface Contact {
    contactId: number;
    dealId: number;
    userName: string;
    contactType: string;
    contactAt: string;
    contactResult: string;
    contactPercentage: number;
}

type SortKey = keyof Deal;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function DealPage() {
    const navigate = useNavigate();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [searchCompanyName, setSearchCompanyName] = useState('');
    const [searchCompanyUserName, setSearchCompanyUserName] = useState('');
    const [searchDealName, setSearchDealName] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [dealDetail, setDealDetail] = useState<DealDetails | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [contact, setContact] = useState<Contact[]>([]);
    type ContactSortKey = keyof Contact;
    const [contactSortState, setContactSortState] = useState<{ key: ContactSortKey, order: 'asc' | 'desc' }>({
        key: 'contactAt',
        order: 'desc',
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const initialDealState = {
        dealName: '',
        companyId: '',
        companyUserId: '',
        userId: '',
        sourceType: 'INBOUND',
        statusType: 'NEW',
        dealAt: '',
    };
    const [newDeal, setNewDeal] = useState(initialDealState);

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

    const multiSort = (list: Deal[]) => {
        if (!Array.isArray(list) || sortState.length === 0) return list;
        return [...list].sort((a, b) => {
            for (const { key, order } of sortState) {
                const aVal = a[key];
                const bVal = b[key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    const diff = aVal - bVal;
                    if (diff !== 0) return order === 'asc' ? diff : -diff;
                } else {
                    const cmp = aVal.toString().localeCompare(bVal.toString(), undefined, { sensitivity: 'base' });
                    if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
                }
            }
            return 0;
        });
    };

    // 컨택 이력 정렬
    const toggleContactSort = (key: ContactSortKey) => {
        setContactSortState(prev => ({
            key,
            order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc',
        }));
    };

    const getContactSortIcon = (key: ContactSortKey) => {
        if (contactSortState.key !== key) return '';
        return contactSortState.order === 'asc' ? ' ▲' : ' ▼';
    };

    const sortedContacts = [...contact].sort((a, b) => {
        const { key, order } = contactSortState;
        const aVal = a[key];
        const bVal = b[key];
        let result: number;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            result = aVal - bVal;
        } else {
            result = aVal.toString().localeCompare(bVal.toString(), undefined, { sensitivity: 'base' });
        }

        return order === 'asc' ? result : -result;
    });

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/deal?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('영업 이력을 불러오는데 실패했습니다.');
            const data = await response.json();
            setDeals(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDealDetails = async (dealId: number) => {
        setDetailLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/deal/dealDetails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dealId }),
            });

            if (!response.ok) throw new Error('상세 정보를 불러오는데 실패했습니다.');

            const data = await response.json();
            setDealDetail(data);
        } catch (err) {
            console.error((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchDeals = async () => {
        const noSearch = !searchCompanyName.trim() && !searchCompanyUserName.trim() && !searchDealName.trim();
        if (noSearch) {
            setSearchMode(false);
            await fetchDeals();
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCompanyName.trim()) params.append('companyName', searchCompanyName);
            if (searchCompanyUserName.trim()) params.append('companyUserName', searchCompanyUserName);
            if (searchDealName.trim()) params.append('dealName', searchDealName);
            params.append('page', page.toString());

            const token = localStorage.getItem('token');
            const response = await fetch(`/deal/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('검색에 실패했습니다.');
            const data = await response.json();
            setDeals(data.content);
            setTotalPages(data.totalPages);
            setSearchMode(true);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const addDeal = async (dealData: {
        dealName: string;
        companyId: number;
        companyUserId: number;
        userId: string;
        sourceType: string;
        statusType: string;
        dealAt: string;
    }) => {
        if (!dealData.dealName.trim()) { return setError('영업명은 필수입니다.'); }
        if (!dealData.companyId || isNaN(dealData.companyId)) { return setError('고객사 ID는 필수입니다.')}
        if (!dealData.companyUserId || isNaN(dealData.companyUserId)) { return setError('고객사 사원 ID는 필수입니다.')}
        if (!dealData.userId.trim()) { return setError('담당자 ID는 필수입니다.')}
        if (!dealData.sourceType.trim()) { return setError('유입 경로는 필수입니다.')}
        if (!dealData.statusType.trim()) { return setError('영업 상태는 필수입니다.')}
        if (!dealData.dealAt.trim()) { return setError('영업 날짜는 필수입니다.')}

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/deal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...dealData,
                    sourceTypeType: dealData.sourceType,
                    statusTypeType: dealData.statusType
                }),
            });

            if (!response.ok) throw new Error('영업 이력 등록에 실패했습니다.');

            alert('영업 이력이 추가되었습니다.');
            setShowAddForm(false);
            await fetchDeals();
            setNewDeal(initialDealState);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDealUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dealDetail) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/deal', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...dealDetail,
                    dealId: selectedDeal?.dealId,
                }),
            });

            if (!response.ok) throw new Error('영업 이력 수정 실패');

            await fetchDeals();
            fetchDealDetails(selectedDeal!.dealId);
            setEditMode(false);
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleDelete = async () => {
        if (!dealDetail) return;

        const confirmDelete = window.confirm('정말 영업 이력을 삭제하시겠습니까?');
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/deal', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dealId: selectedDeal?.dealId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '영업 이력 삭제에 실패했습니다.');
            }

            alert('영업 이력이 삭제되었습니다.');
            setSelectedDeal(null);
            setDealDetail(null);
            setEditMode(false);
            await fetchDeals();
        } catch (err) {
            alert(`삭제 실패: ${(err as Error).message}`);
        }
    };

    const fetchContactByDeal = async (dealId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/contact/byDeal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dealId }),
            });

            if (!response.ok) throw new Error('컨택 이력을 불러오는데 실패했습니다.');
            const data = await response.json();
            setContact(data);
        } catch (error) {
            console.error((error as Error).message);
            setContact([]);
        }
    };

    useEffect(() => {
        if (searchMode) {
            searchDeals().then(() => {});
        } else {
            fetchDeals().then(() => {});
        }
    }, [page]);

    useEffect(() => {
        const allEmpty = !searchCompanyName.trim() && !searchCompanyUserName.trim() && !searchDealName.trim();
        if (allEmpty) setSearchMode(false);
    }, [searchCompanyName, searchCompanyUserName, searchDealName]);

    const sorted = multiSort(deals);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout} />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input type="text" placeholder="고객사명 검색" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} style={{ flex: 1 }} />
                    <input type="text" placeholder="고객사 사원명 검색" value={searchCompanyUserName} onChange={(e) => setSearchCompanyUserName(e.target.value)} style={{ flex: 1 }} />
                    <input type="text" placeholder="영업명 검색" value={searchDealName} onChange={(e) => setSearchDealName(e.target.value)} style={{ flex: 1 }} />
                    <button onClick={() => { setPage(0); searchDeals(); }} >검색하기</button>
                    <button onClick={() => setShowAddForm(true)} >영업이력 추가</button>
                </div>

                {showAddForm && (
                    <div className="overlay">
                        <div className="container">
                            <h3>영업 이력 추가</h3>
                            <form>
                                <div className="form-row"><label>*영업명</label><input type="text" value={newDeal.dealName} onChange={(e) => setNewDeal({ ...newDeal, dealName: e.target.value })} required /></div>
                                <div className="form-row"><label>*고객사 ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={newDeal.companyId} onChange={(e) => setNewDeal({ ...newDeal, companyId: e.target.value.replace(/\D/g, '') })} required /></div>
                                <div className="form-row"><label>*고객사 사원 ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={newDeal.companyUserId} onChange={(e) => setNewDeal({ ...newDeal, companyUserId: e.target.value.replace(/\D/g, '') })} required /></div>
                                <div className="form-row"><label>*담당자 ID</label><input type="text" value={newDeal.userId} onChange={(e) => setNewDeal({ ...newDeal, userId: e.target.value })} required /></div>
                                <div className="form-row">
                                    <label>*유입경로</label>
                                    <select value={newDeal.sourceType} onChange={(e) => setNewDeal({ ...newDeal, sourceType: e.target.value })}>
                                        <option value="INBOUND">INBOUND</option>
                                        <option value="OUTBOUND">OUTBOUND</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label>*영업 상태</label>
                                    <select value={newDeal.statusType} onChange={(e) => setNewDeal({ ...newDeal, statusType: e.target.value })}>
                                        <option value="NEW">NEW</option>
                                        <option value="CONTACTED">CONTACTED</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                </div>
                                <div className="form-row"><label>영업 일자</label><input type="date" value={newDeal.dealAt} onChange={(e) => setNewDeal({ ...newDeal, dealAt: e.target.value })} /></div>
                                <div className="form-row">
                                    <button type="submit" className="nav-button" onClick={() =>
                                        addDeal({
                                            ...newDeal,
                                            companyId: parseInt(newDeal.companyId, 10) || 0,
                                            companyUserId: parseInt(newDeal.companyUserId, 10) || 0,
                                        })
                                    } >등록</button>
                                    <button type="button" onClick={() => { setShowAddForm(false); setNewDeal(initialDealState); }} className="nav-button">취소</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedDeal && dealDetail && (
                    <>
                        <div className="slide-overlay" onClick={() => { setSelectedDeal(null); setEditMode(false); }}></div>
                        <div className={`slide-panel ${selectedDeal && dealDetail ? 'open' : ''}`}>
                            <button className="slide-close-button" onClick={() => { setSelectedDeal(null); setEditMode(false); }}>×</button>
                            {detailLoading ? (
                                <p>로딩 중...</p>
                            ) : editMode ? (
                                <div className="container">
                                    <form onSubmit={handleDealUpdate}>
                                        <h2>영업 이력 수정</h2>
                                        <div className="form-row"><label>영업명</label><input type="text" value={dealDetail.dealName} onChange={(e) => setDealDetail({ ...dealDetail, dealName: e.target.value })} /></div>
                                        <div className="form-row"><label>고객사 ID</label><input type="text" value={dealDetail.companyId} readOnly /></div>
                                        <div className="form-row"><label>고객사 사원 ID</label><input type="text" value={dealDetail.companyUserId} readOnly /></div>
                                        <div className="form-row"><label>유저 ID</label><input type="text" value={dealDetail.userId} onChange={(e) => setDealDetail({ ...dealDetail, userId: e.target.value })} /></div>
                                        <div className="form-row">
                                            <label>유입경로</label>
                                            <select value={dealDetail.sourceType} onChange={(e) => setDealDetail({ ...dealDetail, sourceType: e.target.value })}>
                                                <option value="INBOUND">INBOUND</option>
                                                <option value="OUTBOUND">OUTBOUND</option>
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <label>영업 상태</label>
                                            <select value={dealDetail.statusType} onChange={(e) => setDealDetail({ ...dealDetail, statusType: e.target.value })}>
                                                <option value="NEW">NEW</option>
                                                <option value="CONTACTED">CONTACTED</option>
                                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                                <option value="CLOSED">CLOSED</option>
                                            </select>
                                        </div>
                                        <div className="form-row"><label>영업 일자</label><input type="date" value={dealDetail.dealAt} onChange={(e) => setDealDetail({ ...dealDetail, dealAt: e.target.value })} /></div>
                                        <div className="form-row"><label>수정일</label><span>{new Date(dealDetail.updatedAt).toLocaleString()}</span></div>
                                        <button type="submit">저장</button>
                                    </form>
                                </div>
                            ) : (
                                <div className="container">
                                    <h3>영업 상세 정보</h3>
                                    <div className="form-row"><label>영업명</label><span>{dealDetail.dealName}</span></div>
                                    <div className="form-row"><label>고객사 ID</label><span>{dealDetail.companyId}</span></div>
                                    <div className="form-row"><label>고객사 사원 ID</label><span>{dealDetail.companyUserId}</span></div>
                                    <div className="form-row"><label>담당자</label><span>{dealDetail.userName}</span></div>
                                    <div className="form-row"><label>유입경로</label><span>{dealDetail.sourceType}</span></div>
                                    <div className="form-row"><label>영업 상태</label><span>{dealDetail.statusType}</span></div>
                                    <div className="form-row"><label>영업 일자</label><span>{new Date(dealDetail.dealAt).toLocaleDateString()}</span></div>
                                    <div className="form-row"><label>수정일</label><span>{new Date(dealDetail.updatedAt).toLocaleString()}</span></div>
                                    <button className="nav-button" onClick={() => setEditMode(true)}>영업 이력 수정하기</button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Table */}
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <table className="table">
                        <thead>
                        <tr>
                            <th><button onClick={() => toggleSort('dealId')}>영업 ID{getSortIcon('dealId')}</button></th>
                            <th><button onClick={() => toggleSort('dealName')}>영업명{getSortIcon('dealName')}</button></th>
                            <th><button onClick={() => toggleSort('companyId')}>고객사 ID{getSortIcon('companyId')}</button></th>
                            <th><button onClick={() => toggleSort('companyUserId')}>고객사 사원 ID{getSortIcon('companyUserId')}</button></th>
                            <th><button onClick={() => toggleSort('userName')}>담당자{getSortIcon('userName')}</button></th>
                            <th><button onClick={() => toggleSort('sourceType')}>유입 경로{getSortIcon('sourceType')}</button></th>
                            <th><button onClick={() => toggleSort('statusType')}>영업 상태{getSortIcon('statusType')}</button></th>
                            <th><button onClick={() => toggleSort('dealAt')}>영업 날짜{getSortIcon('dealAt')}</button></th>
                        </tr>
                        </thead>
                        <tbody>
                        {sorted.map((deal) => (
                            <tr key={deal.dealId}>
                                <td>{deal.dealId}</td>
                                <td
                                    className="clicktable"
                                    onClick={() => {
                                        setSelectedDeal(deal);
                                        fetchDealDetails(deal.dealId);
                                        fetchContactByDeal(deal.dealId);
                                    }}
                                >
                                    {deal.dealName}
                                </td>
                                <td>{deal.companyId}</td>
                                <td>{deal.companyUserId}</td>
                                <td>{deal.userName}</td>
                                <td>{deal.sourceType}</td>
                                <td>{deal.statusType}</td>
                                <td>{new Date(deal.dealAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="pagination">
                <button onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0} className="page-button">&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => {
                    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
                        return (
                            <button key={i} onClick={() => setPage(i)} className={`page-button ${page === i ? 'active' : ''}`}>
                                {i + 1}
                            </button>
                        );
                    }
                    if (
                        (i === 1 && page > 3) ||
                        (i === totalPages - 2 && page < totalPages - 4) ||
                        (Math.abs(i - page) === 2)
                    ) {
                        return <span key={i} className="page-dots">...</span>;
                    }
                    return null;
                })}
                <button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))} disabled={page === totalPages - 1} className="page-button">&gt;</button>
            </div>

            {/* Slide Panel */}
            {selectedDeal && dealDetail && (
                <>
                    <div className="slide-overlay" onClick={() => { setSelectedDeal(null); setEditMode(false); }}></div>
                    <div className={`slide-panel open`}>
                        <button className="slide-close-button" onClick={() => { setSelectedDeal(null); setEditMode(false); }}>×</button>
                        {detailLoading ? (
                            <p>로딩 중...</p>
                        ) : editMode ? (
                            <div className="container">
                                <form onSubmit={handleDealUpdate}>
                                    <h2>영업 이력 수정</h2>
                                    <div className="form-row"><label>영업명</label><input type="text" value={dealDetail.dealName} onChange={(e) => setDealDetail({ ...dealDetail, dealName: e.target.value })} /></div>
                                    <div className="form-row"><label>고객사 ID</label><input type="text" value={dealDetail.companyId} readOnly /></div>
                                    <div className="form-row"><label>고객사 사원 ID</label><input type="text" value={dealDetail.companyUserId} onChange={(e) => setDealDetail({ ...dealDetail, companyUserId: Number(e.target.value) })}/></div>
                                    <div className="form-row"><label>유저 ID</label><input type="text" value={dealDetail.userId} onChange={(e) => setDealDetail({ ...dealDetail, userId: e.target.value })} /></div>
                                    <div className="form-row"><label>유입 경로</label>
                                        <select value={dealDetail.sourceType} onChange={(e) => setDealDetail({ ...dealDetail, sourceType: e.target.value })}>
                                            <option value="INBOUND">INBOUND</option>
                                            <option value="OUTBOUND">OUTBOUND</option>
                                        </select>
                                    </div>
                                    <div className="form-row"><label>영업 상태</label>
                                        <select value={dealDetail.statusType} onChange={(e) => setDealDetail({ ...dealDetail, statusType: e.target.value })}>
                                            <option value="NEW">NEW</option>
                                            <option value="CONTACTED">CONTACTED</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    </div>
                                    <div className="form-row"><label>영업 일자</label><input type="date" value={dealDetail.dealAt} onChange={(e) => setDealDetail({ ...dealDetail, dealAt: e.target.value })} /></div>
                                    <div className="form-row"><label>수정일</label><span>{new Date(dealDetail.updatedAt).toLocaleString()}</span></div>
                                    <button type="submit">저장</button>
                                </form>
                            </div>
                        ) : (
                            <div className="container">
                                <h3>영업 상세 정보</h3>
                                <div className="form-row"><label>영업명</label><span>{dealDetail.dealName}</span></div>
                                <div className="form-row"><label>고객사 ID</label><span>{dealDetail.companyId}</span></div>
                                <div className="form-row"><label>고객사 사원 ID</label><span>{dealDetail.companyUserId}</span></div>
                                <div className="form-row"><label>담당자</label><span>{dealDetail.userName}</span></div>
                                <div className="form-row"><label>유입 경로</label><span>{dealDetail.sourceType}</span></div>
                                <div className="form-row"><label>영업 상태</label><span>{dealDetail.statusType}</span></div>
                                <div className="form-row"><label>영업 일자</label><span>{new Date(dealDetail.dealAt).toLocaleDateString()}</span></div>
                                <div className="form-row"><label>수정일</label><span>{new Date(dealDetail.updatedAt).toLocaleString()}</span></div>
                                <button className="nav-button" onClick={() => setEditMode(true)}>영업 이력 수정하기</button>
                                <div className="container-delete">
                                    <span onClick={handleDelete} >영업 이력 삭제하기</span>
                                </div>
                                <div className="container-contain">
                                    {contact.length === 0 ? (
                                        <p>등록된 컨택 이력이 없습니다.</p>
                                    ) : (
                                        <div className="history">
                                            <table className="table">
                                                <thead>
                                                <tr>
                                                    <th onClick={() => toggleContactSort('contactId')}>컨택 ID{getContactSortIcon('contactId')}</th>
                                                    <th onClick={() => toggleContactSort('userName')}>담당자{getContactSortIcon('userName')}</th>
                                                    <th onClick={() => toggleContactSort('contactType')}>컨택 유형{getContactSortIcon('contactType')}</th>
                                                    <th onClick={() => toggleContactSort('contactResult')}>컨택 결과{getContactSortIcon('contactResult')}</th>
                                                    <th onClick={() => toggleContactSort('contactPercentage')}>진행률 (%) {getContactSortIcon('contactPercentage')}</th>
                                                    <th onClick={() => toggleContactSort('contactAt')}>컨택 일자{getContactSortIcon('contactAt')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {sortedContacts.map((c) => (
                                                    <tr key={c.contactId}>
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default DealPage;
