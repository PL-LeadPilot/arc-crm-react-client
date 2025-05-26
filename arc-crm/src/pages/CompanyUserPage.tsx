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
    source: string;
    status: string;
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
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
    const [companyUserDetail, setCompanyUserDetail] = useState<CompanyUserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [deals, setDeals] = useState<Deal[]>([]);

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
            const existing = prev.find((s) => s.key === key);
            const nextOrder = !existing || existing.order === 'desc' ? 'asc' : 'desc';

            // 기존 key가 있으면 순서 유지, 정렬 방향만 변경
            if (existing) {
                return prev.map((s) => s.key === key ? { key, order: nextOrder } : s);
            }

            // 새로 추가된 정렬 기준은 뒤에 붙이기
            return [...prev, { key, order: nextOrder }];
        });
    };

    const getSortIcon = (key: SortKey) => {
        const state = sortState.find((s) => s.key === key);
        if (!state) return '';
        return state.order === 'asc' ? ' ▲' : ' ▼';
    };

    const multiSort = (list: CompanyUser[]) => {
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

    const fetchCompanyUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ companyUserId }),
            });
            if (!response.ok) throw new Error('상세 정보를 불러오지 못했습니다.');
            const data = await response.json();
            const fullDetail = { ...selectedUser!, ...data };
            setCompanyUserDetail(fullDetail);
            await fetchDealsByCompany(fullDetail.companyId, fullDetail.companyUserId);

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

            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser/search?companyName=${encodeURIComponent(searchCompanyName)}&companyUserName=${encodeURIComponent(searchCompanyUserName)}&page=0`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) throw new Error('검색에 실패했습니다.');
            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setPage(0);
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
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(companyUserData),
            });

            if (!response.ok) throw new Error('고객사 사원 등록에 실패했습니다.');

            await fetchCompanyUsers();
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
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    companyUserId: selectedUser?.companyUserId,
                    companyId: companyUserDetail.companyId,
                    companyUserName: companyUserDetail.companyUserName,
                    companyUserPhone: companyUserDetail.companyUserPhone,
                    companyUserEmail: companyUserDetail.companyUserEmail,
                    companyUserPosition: companyUserDetail.companyUserPosition,
                    companyUserDivision: companyUserDetail.companyUserDivision,
                }),
            });

            if (!response.ok) throw new Error('고객사 사원 정보 수정 실패');

            await fetchCompanyUsers();
            fetchCompanyUserDetails(selectedUser!.companyUserId);
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
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    companyUserId: selectedUser?.companyUserId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 사원 삭제에 실패했습니다.');
            }

            alert('고객사 사원이 삭제되었습니다.');
            setSelectedUser(null);
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
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ companyId }),
            });
            if (!response.ok) throw new Error('영업 이력 조회 실패');
            const data = await response.json();
            const filtered = data.filter((deal: Deal) => deal.companyUserId === companyUserId);
            setDeals(filtered);
        } catch (err) {
            console.error('영업 목록 조회 실패:', err);
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

    const sorted = multiSort(users);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout}
            />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input type="text" placeholder="고객사명 검색" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <input type="text" placeholder="사원명 검색" value={searchCompanyUserName} onChange={(e) => setSearchCompanyUserName(e.target.value)} />
                    <button onClick={searchCompanyUsers} >검색하기</button>
                </div>

                <div className="content-box">
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
                    <input
                        type="text"
                        placeholder="*고객사 사원 이름"
                        value={newCompanyUser.companyUserName}
                        onChange={(e) =>
                            setNewCompanyUser({ ...newCompanyUser, companyUserName: e.target.value })
                        }
                    />
                    <input type="text"
                        placeholder="*고객사 사원 이메일"
                        value={newCompanyUser.companyUserEmail}
                        onChange={(e) =>
                            setNewCompanyUser({ ...newCompanyUser, companyUserEmail: e.target.value })
                        }
                    />
                    <button
                        onClick={() =>
                            addCompanyUser({
                                ...newCompanyUser,
                                companyId: parseInt(newCompanyUser.companyId, 10) || 0
                            })
                        } > 고객사 사원 추가 </button>
                </div>

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
                            {sorted.map((user) => (
                                <tr key={user.companyUserId}>
                                    <td>{user.companyUserId}</td>
                                    <td
                                        className="clicktable"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            fetchCompanyUserDetails(user.companyUserId);
                                        }}
                                    >
                                        {user.companyUserName}
                                    </td>
                                    <td>{user.companyName}</td>
                                    <td>{user.companyUserPhone}</td>
                                    <td>{user.companyUserEmail}</td>
                                    <td>{user.companyUserPosition}</td>
                                    <td>{user.companyUserDivision}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination" style={{ marginTop: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                                disabled={page === 0}
                                className="page-button"
                            >
                                &lt;
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                                if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
                                    return (
                                        <button
                                            key={i}
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
                                    return <span key={i} className="page-dots">...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                                disabled={page === totalPages - 1}
                                className="page-button"
                            >
                                &gt;
                            </button>
                        </div>

                        {selectedUser && companyUserDetail && (
                            <>
                                <div className="slide-overlay" onClick={() => { setSelectedUser(null); setEditMode(false); }}></div>
                                <div className={`slide-panel ${selectedUser && companyUserDetail ? 'open' : ''}`}>
                                <button className="slide-close-button" onClick={() => { setSelectedUser(null); setEditMode(false); }}>×</button>
                                    {detailLoading ? (
                                        <p>로딩 중...</p>
                                    ) : editMode ? (
                                        <div className="container">
                                            <form onSubmit={handleCompanyUserUpdate}>
                                                <h2>고객사 사원 정보 수정</h2>
                                                <h5>고객사 ID 및 고객사명은 수정 불가</h5>
                                                <div className="form-row">
                                                    <label>고객사 ID</label>
                                                    <input type="text" value={companyUserDetail.companyId} readOnly />
                                                </div>
                                                <div className="form-row">
                                                    <label>고객사명</label>
                                                    <input type="text" value={companyUserDetail.companyName} readOnly />
                                                </div>
                                                <div className="form-row">
                                                    <label>*이름</label>
                                                    <input type="text" value={companyUserDetail.companyUserName} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserName: e.target.value })} />
                                                </div>
                                                <div className="form-row">
                                                    <label>전화번호</label>
                                                    <input type="text" value={companyUserDetail.companyUserPhone} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserPhone: e.target.value })} />
                                                </div>
                                                <div className="form-row">
                                                    <label>*이메일</label>
                                                    <input type="text" value={companyUserDetail.companyUserEmail} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserEmail: e.target.value })} />
                                                </div>
                                                <div className="form-row">
                                                    <label>직급</label>
                                                    <input type="text" value={companyUserDetail.companyUserPosition} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserPosition: e.target.value })} />
                                                </div>
                                                <div className="form-row">
                                                    <label>부서</label>
                                                    <input type="text" value={companyUserDetail.companyUserDivision} onChange={(e) => setCompanyUserDetail({ ...companyUserDetail, companyUserDivision: e.target.value })} />
                                                </div>
                                                <button type="submit">저장</button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="container">
                                            <h3>고객사 사원 상세 정보</h3>
                                            <div className="form-row"><label>고객사 ID</label><span>{companyUserDetail.companyId}</span></div>
                                            <div className="form-row"><label>고객사명</label><span>{companyUserDetail.companyName}</span></div>
                                            <div className="form-row"><label>이름</label><span>{companyUserDetail.companyUserName}</span></div>
                                            <div className="form-row"><label>전화번호</label><span>{companyUserDetail.companyUserPhone}</span></div>
                                            <div className="form-row"><label>이메일</label><span>{companyUserDetail.companyUserEmail}</span></div>
                                            <div className="form-row"><label>직급</label><span>{companyUserDetail.companyUserPosition}</span></div>
                                            <div className="form-row"><label>부서</label><span>{companyUserDetail.companyUserDivision}</span></div>
                                            <div className="form-row"><label>수정일</label><span>{new Date(companyUserDetail.updatedAt).toLocaleString()}</span></div>
                                            <button className="nav-button" onClick={() => setEditMode(true)}>고객사 사원 정보 수정하기</button>
                                            <div className="container-delete">
                                                <span onClick={handleDelete} >고객사 사원 정보 삭제하기</span>
                                            </div>
                                            <div style={{ marginTop: '20px' }}>
                                                {deals.length === 0 ? <p>영업 이력이 없습니다.</p> : (
                                                    <div className="history">
                                                        <table className="table">
                                                            <thead className="header">
                                                            <tr>
                                                                <th>영업명</th>
                                                                <th>상태</th>
                                                                <th>유입경로</th>
                                                                <th>담당자</th>
                                                                <th>날짜</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {deals.map((deal) => (
                                                                <tr key={deal.dealId}>
                                                                    <td>{deal.dealName}</td>
                                                                    <td>{deal.status}</td>
                                                                    <td>{deal.source}</td>
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
