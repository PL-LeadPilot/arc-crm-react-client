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

type SortKey = keyof CompanyUser;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function CompanyUserPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [searchCompany, setSearchCompany] = useState('');
    const [searchName, setSearchName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [companyId, setCompanyId] = useState<string>(''); // 숫자 대신 문자열
    const [newCompanyUserName, setNewCompanyUserName] = useState('');
    const [newCompanyUserPhone, setNewCompanyUserPhone] = useState('');
    const [newCompanyUserEmail, setNewCompanyUserEmail] = useState('');
    const [newCompanyUserPosition, setNewCompanyUserPosition] = useState('');
    const [newCompanyUserDivision, setNewCompanyUserDivision] = useState('');
    const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
    const [companyUserDetail, setCompanyUserDetail] = useState<CompanyUserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const ITEMS_PER_PAGE = 20;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const toggleSort = (key: SortKey) => {
        setSortState((prev) => {
            const existing = prev.find((s) => s.key === key);
            const nextOrder = !existing || existing.order === 'desc' ? 'asc' : 'desc';
            const newSort: SortState = { key, order: nextOrder };
            return [newSort, ...prev.filter((s) => s.key !== key)];
        });
    };

    const getSortIcon = (key: SortKey) => {
        const state = sortState.find((s) => s.key === key);
        if (!state) return '';
        return state.order === 'asc' ? ' ▲' : ' ▼';
    };

    const multiSort = (list: CompanyUser[]) => {
        if (!Array.isArray(list)) return [];

        return [...list].sort((a, b) => {
            for (const { key, order } of sortState) {
                const aVal = a[key];
                const bVal = b[key];

                // 숫자일 경우 직접 비교
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return order === 'asc' ? aVal - bVal : bVal - aVal;
                }

                // 문자열 비교
                const aStr = aVal.toString().toLowerCase();
                const bStr = bVal.toString().toLowerCase();
                const cmp = aStr.localeCompare(bStr);
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    };

    const fetchCompanyUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser?page=${page}&size=${ITEMS_PER_PAGE}`, {
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
            setCompanyUserDetail(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchCompanyUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/companyUser/search?companyName=${encodeURIComponent(searchCompany)}&companyUserName=${encodeURIComponent(searchName)}&page=0`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setPage(0);
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

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 사원 등록에 실패했습니다.');
            }

            await fetchCompanyUsers();
            setNewCompanyUserName('');
            setNewCompanyUserPhone('');
            setNewCompanyUserEmail('');
            setNewCompanyUserPosition('');
            setNewCompanyUserDivision('');
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

    useEffect(() => {
        fetchCompanyUsers();
    }, [page]);

    const sorted = multiSort(users);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout}
            />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input
                        type="text"
                        placeholder="고객사명 검색"
                        value={searchCompany}
                        onChange={(e) => setSearchCompany(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="text"
                        placeholder="사원명 검색"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button onClick={searchCompanyUsers} className="nav-button">검색</button>
                </div>

                <div className="content-box">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="*고객사 ID"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value.replace(/\D/g, ''))}
                        className="form-input"
                        style={{ flex: 1 }}
                    />
                    <input
                        type="text"
                        placeholder="*고객사 사원 이름"
                        value={newCompanyUserName}
                        onChange={(e) => setNewCompanyUserName(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="text"
                        placeholder="*고객사 사원 이메일"
                        value={newCompanyUserEmail}
                        onChange={(e) => setNewCompanyUserEmail(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        onClick={() =>
                            addCompanyUser({
                                companyId: parseInt(companyId, 10) || 0,
                                companyUserName: newCompanyUserName,
                                companyUserPhone: newCompanyUserPhone,
                                companyUserEmail: newCompanyUserEmail,
                                companyUserPosition: newCompanyUserPosition,
                                companyUserDivision: newCompanyUserDivision,
                            })
                        }
                        className="nav-button"
                    >
                        고객사 사원 추가
                    </button>
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
                                <div className="slide-panel open">
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
