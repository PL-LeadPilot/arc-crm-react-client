import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/container.css';
import '../styles/form.css';
import '../styles/nav.css';
import '../styles/page.css';
import '../styles/table.css';
import Navbar from "./components/Navbar";

interface CompanyUser {
    companyId: number;
    companyUserId: number;
    companyName: string;
    companyUserName: string;
    companyUserPhone: string;
    companyUserEmail: string;
    companyUserPosition: string;
    companyUserDivision: string;
}

interface CompanyUserDetail extends CompanyUser {
    updatedAt: string;
}

interface Deal {
    dealId: number;
    dealName: string;
    companyUserId: number;
    userName: string;
    sourceType: string;
    statusType: string;
    dealAt: string;
}

type SortKey = keyof CompanyUser;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function CompanyUserPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [searchCompanyName, setSearchCompanyName] = useState('');
    const [searchCompanyUserName, setSearchCompanyUserName] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortState, setSortState] = useState<SortState>({
        key: 'companyName',
        order: 'asc',
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCompanyUser, setSelectedCompanyUser] = useState<CompanyUser | null>(null);
    const [companyUserDetail, setCompanyUserDetail] = useState<CompanyUserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    type DealSortKey = keyof Deal;
    const [dealSortState, setDealSortState] = useState<{ key: DealSortKey; order: 'asc' | 'desc' }>({
        key: 'dealAt',
        order: 'desc',
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const initialCompanyUserState = {
        companyId: '',
        companyUserName: '',
        companyUserPhone: '',
        companyUserEmail: '',
        companyUserPosition: '',
        companyUserDivision: '',
    }
    const [newCompanyUser, setNewCompanyUser] = useState(initialCompanyUserState);

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

    const Sort = (list: CompanyUser[]) => {
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

    const toggleDealSort = (key: DealSortKey) => {
        setDealSortState(prev => ({
            key,
            order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc',
        }));
    };

    const getDealSortIcon = (key: DealSortKey) => {
        if (dealSortState.key !== key) return '';
        return dealSortState.order === 'asc' ? ' ▲' : ' ▼';
    };

    const sortedDeals = [...deals].sort((a, b) => {
        const { key, order } = dealSortState;
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

    const fetchCompanyUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('고객사 사원 정보를 불러오는데 실패했습니다.');
            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyUserDetails = async (companyUserId: number) => {
        setDetailLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/companyUser/companyUserDetails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyUserId }),
            });
            if (!response.ok) throw new Error('상세 정보를 불러오는데 실패했습니다.');
            const data = await response.json();
            setCompanyUserDetail(data);
            await fetchDealsByCompany(data.companyId, data.companyUserId);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchCompanyUsers = async () => {
        const noSearch = !searchCompanyName.trim() && !searchCompanyUserName.trim();
        if (noSearch) {
            setSearchMode(false);
            await fetchCompanyUsers();
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCompanyName.trim()) params.append('companyName', searchCompanyName);
            if (searchCompanyUserName.trim()) params.append('companyUserName', searchCompanyUserName);
            params.append('page', page.toString());

            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('검색에 실패했습니다.');
            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setSearchMode(true);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const addCompanyUser = async (companyUserData: {
        companyId: number;
        companyUserName: string;
        companyUserPhone: string;
        companyUserEmail: string;
        companyUserPosition: string;
        companyUserDivision: string;
    }) => {
        if (!companyUserData.companyId || isNaN(companyUserData.companyId)) {
            return setError('고객사 ID는 필수입니다.');
        }
        if (!companyUserData.companyUserName.trim()) return setError('고객사 사원 이름은 필수입니다.');
        if (!companyUserData.companyUserEmail.trim()) return setError('고객사 사원 이메일은 필수입니다.');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/companyUser', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(companyUserData),
            });

            if (!response.ok) throw new Error('고객사 사원 등록에 실패했습니다.');

            alert('고객사 사원 등록에 성공했습니다.');
            await fetchCompanyUsers();
            setShowAddForm(false);
            setNewCompanyUser(initialCompanyUserState);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyUserUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyUserDetail) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/companyUser', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...companyUserDetail,
                    companyUserId: selectedCompanyUser?.companyUserId,
                }),
            });

            if (!response.ok) throw new Error('고객사 사원 정보 수정 실패');

            await fetchCompanyUsers();
            fetchCompanyUserDetails(selectedCompanyUser!.companyUserId);
            setEditMode(false);
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm('정말 고객사 사원을 삭제하시겠습니까?');
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/companyUser', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyUserId: selectedCompanyUser?.companyUserId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 사원 삭제에 실패했습니다.');
            }

            alert('고객사 사원이 삭제되었습니다.');
            setSelectedCompanyUser(null);
            setCompanyUserDetail(null);
            setEditMode(false);
            await fetchCompanyUsers();
        } catch (err) {
            alert(`삭제 실패: ${(err as Error).message}`);
        }
    };

    const fetchDealsByCompany = async (companyId: number, companyUserId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/deal/byCompany`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyId }),
            });
            if (!response.ok) throw new Error('영업 이력 조회 실패');
            const data = await response.json();
            const filtered = data.filter((deal: Deal) => deal.companyUserId === companyUserId);
            setDeals(filtered);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchMode) {
            searchCompanyUsers().then(() => {});
        } else {
            fetchCompanyUsers().then(() => {});
        }
    }, [page]);

    useEffect(() => {
        const allEmpty = !searchCompanyName.trim() && !searchCompanyUserName.trim();
        if (allEmpty) setSearchMode(false);
    }, [searchCompanyName, searchCompanyUserName]);

    const sorted = Sort(users);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout} />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input type="text" placeholder="고객사명" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <input type="text" placeholder="사원명" value={searchCompanyUserName} onChange={(e) => setSearchCompanyUserName(e.target.value)} />
                    <button type="button" onClick={() => { setPage(0); searchCompanyUsers(); }} >검색</button>
                    <button type="button" onClick={() => setShowAddForm(true)}>고객사 사원 등록</button>
                </div>

                {showAddForm && (
                    <div className="overlay">
                        <div className="container">
                            <h3>고객사 사원 등록</h3>
                            <div className="form-row">
                                <label>*고객사 ID</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="*고객사 ID"
                                    value={newCompanyUser.companyId}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyId: e.target.value.replace(/\D/g, '') })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <label>*고객사 사원 이름</label>
                                <input
                                    type="text"
                                    placeholder="*고객사 사원 이름"
                                    value={newCompanyUser.companyUserName}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyUserName: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <label>전화번호</label>
                                <input
                                    type="text"
                                    placeholder="전화번호"
                                    value={newCompanyUser.companyUserPhone}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyUserPhone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <label>*이메일</label>
                                <input
                                    type="email"
                                    placeholder="이메일"
                                    value={newCompanyUser.companyUserEmail}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyUserEmail: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <label>직급</label>
                                <input
                                    type="text"
                                    placeholder="직급"
                                    value={newCompanyUser.companyUserPosition}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyUserPosition: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <label>부서</label>
                                <input
                                    type="text"
                                    placeholder="부서"
                                    value={newCompanyUser.companyUserDivision}
                                    onChange={(e) =>
                                        setNewCompanyUser({ ...newCompanyUser, companyUserDivision: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <button
                                    type="button"
                                    className="nav-button"
                                    onClick={() =>
                                        addCompanyUser({
                                            ...newCompanyUser,
                                            companyId: parseInt(newCompanyUser.companyId, 10) || 0
                                        })
                                    }
                                >등록
                                </button>
                                <button type="button" className="nav-button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewCompanyUser(initialCompanyUserState);
                                    }}
                                >취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><button onClick={() => toggleSort('companyUserId')}>고객사 사원 ID{getSortIcon('companyUserId')}</button> </th>
                                <th><button onClick={() => toggleSort('companyUserName')}>이름{getSortIcon('companyUserName')}</button></th>
                                <th><button onClick={() => toggleSort('companyName')}>고객사명{getSortIcon('companyName')}</button></th>
                                <th><button onClick={() => toggleSort('companyUserPhone')}>전화번호{getSortIcon('companyUserPhone')}</button></th>
                                <th><button onClick={() => toggleSort('companyUserEmail')}>이메일{getSortIcon('companyUserEmail')}</button></th>
                                <th><button onClick={() => toggleSort('companyUserPosition')}>직급{getSortIcon('companyUserPosition')}</button></th>
                                <th><button onClick={() => toggleSort('companyUserDivision')}>부서{getSortIcon('companyUserDivision')}</button></th>
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((companyUser) => (
                                <tr key={companyUser.companyUserId}
                                    className={`open-slide-panel ${selectedCompanyUser?.companyUserId === companyUser.companyUserId ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCompanyUser(companyUser);
                                        fetchCompanyUserDetails(companyUser.companyUserId);
                                    }}>
                                    <td>{companyUser.companyUserId}</td>
                                    <td>{companyUser.companyUserName}</td>
                                    <td>{companyUser.companyName}</td>
                                    <td>{companyUser.companyUserPhone}</td>
                                    <td>{companyUser.companyUserEmail}</td>
                                    <td>{companyUser.companyUserPosition}</td>
                                    <td>{companyUser.companyUserDivision}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

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

                        {selectedCompanyUser && companyUserDetail && (
                            <>
                                <div className="slide-overlay" onClick={() => { setSelectedCompanyUser(null); setEditMode(false); }}></div>
                                <div className={`slide-panel ${selectedCompanyUser && companyUserDetail ? 'open' : ''}`}>
                                <button className="slide-close-button" onClick={() => { setSelectedCompanyUser(null); setEditMode(false); }}>×</button>
                                    {detailLoading ? (
                                        <p>로딩 중...</p>
                                    ) : editMode ? (
                                        <div className="container">
                                            <form onSubmit={handleCompanyUserUpdate}>
                                                <h3>고객사 사원 정보 수정</h3>
                                                <div className="form-row"><label>고객사원 ID</label><span>{selectedCompanyUser.companyUserId}</span></div>
                                                <div className="form-row"><label>고객사 ID</label><span>{companyUserDetail.companyId}</span></div>
                                                <div className="form-row"><label>고객사명</label><span>{companyUserDetail.companyName}</span></div>
                                                <div className="form-row"><label>*이름</label><input type="text" value={companyUserDetail.companyUserName} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserName: e.target.value })} /></div>
                                                <div className="form-row"><label>전화번호</label><input type="text" value={companyUserDetail.companyUserPhone} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserPhone: e.target.value })} /></div>
                                                <div className="form-row"><label>*이메일</label><input type="text" value={companyUserDetail.companyUserEmail} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserEmail: e.target.value })} /></div>
                                                <div className="form-row"><label>직급</label><input type="text" value={companyUserDetail.companyUserPosition} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserPosition: e.target.value })} /></div>
                                                <div className="form-row"><label>부서</label><input type="text" value={companyUserDetail.companyUserDivision} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserDivision: e.target.value })} /></div>
                                                <div className="form-row">
                                                    <button type="submit" className="nav-button">저장</button>
                                                    <button
                                                        type="button"
                                                        className="nav-button"
                                                        onClick={() => {
                                                            setEditMode(false);
                                                            setCompanyUserDetail(null);
                                                        }}
                                                    >취소
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="container">
                                            <h3>고객사 사원 상세 정보</h3>
                                            <div className="form-row"><label>고객사원 ID</label><span>{selectedCompanyUser.companyUserId}</span></div>
                                            <div className="form-row"><label>고객사 ID</label><span>{companyUserDetail.companyId}</span></div>
                                            <div className="form-row"><label>고객사명</label><span>{companyUserDetail.companyName}</span></div>
                                            <div className="form-row"><label>이름</label><span>{companyUserDetail.companyUserName}</span></div>
                                            <div className="form-row"><label>전화번호</label><span>{companyUserDetail.companyUserPhone}</span></div>
                                            <div className="form-row"><label>이메일</label><span>{companyUserDetail.companyUserEmail}</span></div>
                                            <div className="form-row"><label>직급</label><span>{companyUserDetail.companyUserPosition}</span></div>
                                            <div className="form-row"><label>부서</label><span>{companyUserDetail.companyUserDivision}</span></div>
                                            <div className="form-row"><label>수정일</label><span>{new Date(companyUserDetail.updatedAt).toLocaleString()}</span></div>
                                            <button className="nav-button" onClick={() => setEditMode(true)}>수정</button>
                                            <div className="container-delete">
                                                <span onClick={handleDelete} >고객사 사원 정보 삭제</span>
                                            </div>
                                            <div className="container-contain">
                                                {deals.length === 0 ? (
                                                    <p>등록된 영업 이력이 없습니다.</p>
                                                ) : (
                                                    <div className="history">
                                                        <table className="table">
                                                            <thead>
                                                            <tr>
                                                                <th onClick={() => toggleDealSort('dealName')}>영업명{getDealSortIcon('dealName')}</th>
                                                                <th onClick={() => toggleDealSort('statusType')}>상태{getDealSortIcon('statusType')}</th>
                                                                <th onClick={() => toggleDealSort('sourceType')}>유입경로{getDealSortIcon('sourceType')}</th>
                                                                <th onClick={() => toggleDealSort('userName')}>담당자{getDealSortIcon('userName')}</th>
                                                                <th onClick={() => toggleDealSort('dealAt')}>일자{getDealSortIcon('dealAt')}</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {sortedDeals.map((deal) => (
                                                                <tr key={deal.dealId}>
                                                                    <td>{deal.dealName}</td>
                                                                    <td>{deal.statusType}</td>
                                                                    <td>{deal.sourceType}</td>
                                                                    <td>{deal.userName}</td>
                                                                    <td>{new Date(deal.dealAt).toLocaleDateString()}</td>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default CompanyUserPage;
