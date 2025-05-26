import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/container.css';
import '../styles/form.css';
import '../styles/nav.css';
import '../styles/page.css';
import '../styles/table.css';
import '../styles/slide-page.css';
import Navbar from "./components/Navbar";

interface Company {
    companyId: number;
    companyName: string;
    companyAddress: string;
    userId: string;
    userName: string;
}

interface CompanyDetail extends Company {
    updatedAt: string;
}

interface CompanyUser {
    companyUserId: number;
    companyUserName: string;
    companyUserPhone: string;
    companyUserEmail: string;
    companyUserPosition: string;
    companyUserDivision: string;
}

type SortKey = keyof Company;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function CompanyPage() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [searchCompanyName, setSearchCompanyName] = useState('');
    const [searchMode, setSearchMode] = useState(false); // 검색 중 여부
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyDetail, setCompanyDetail] = useState<CompanyDetail | null>(null);
    const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const initialCompanyState = {
        companyName: '',
        companyAddress: '',
        userId: ''
    }

    const [newCompany, setNewCompany] = useState(initialCompanyState);

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

    const multiSort = (list: Company[]) => {
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

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/company?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('고객사 정보를 불러오지 못했습니다.');
            const data = await response.json();
            setCompanies(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (companyId: number) => {
        setDetailLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const [detailRes, userRes] = await Promise.all([
                fetch('/company/companyDetails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ companyId }),
                }),
                fetch('/companyUser/byCompany', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ companyId }),
                })
            ]);
            const detailData = await detailRes.json();
            const userData = await userRes.json();
            setCompanyDetail(detailData);
            setCompanyUsers(userData);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchCompanies = async () => {
        const noSearch = !searchCompanyName.trim();
        if (noSearch) {
            setSearchMode(false);
            await fetchCompanies();
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCompanyName) params.append('companyName', searchCompanyName);
            params.append('page', page.toString());

            const token = localStorage.getItem('token');
            const response = await fetch(`/company/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('검색에 실패했습니다.');
            const data = await response.json();
            setCompanies(data.content);
            setTotalPages(data.totalPages);
            setSearchMode(true);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const addCompany = async (companyData: {
        companyName: string;
        companyAddress: string;
        userId: string
    }) => {
        if (!companyData.companyName.trim()) { return setError('고객사명은 필수입니다.'); }
        if (!companyData.userId.trim()) { return setError('유저 ID는 필수입니다.'); }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/company', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(companyData),
            });

            if (!response.ok) throw new Error('고객사 등록에 실패했습니다.');

            await fetchCompanies();
            setNewCompany(initialCompanyState);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyDetail) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/company', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    companyId: companyDetail.companyId,
                    companyName: companyDetail.companyName,
                    companyAddress: companyDetail.companyAddress,
                    userId: companyDetail.userId,
                }),
            });

            if (!response.ok) throw new Error('고객사 수정 실패');

            await fetchCompanies();
            await fetchCompanyDetails(companyDetail.companyId);
            setEditMode(false);
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const handleDelete = async () => {
        if (!companyDetail) return;

        const confirmDelete = window.confirm('정말 고객사를 삭제하시겠습니까?');
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/company', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    companyId: companyDetail.companyId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 삭제에 실패했습니다.');
            }

            alert('고객사가 삭제되었습니다.');
            setSelectedCompany(null);
            setCompanyDetail(null);
            setEditMode(false);
            await fetchCompanies();
        } catch (err) {
            alert(`삭제 실패: ${(err as Error).message}`);
        }
    };

    useEffect(() => {
        if (searchMode) {
            searchCompanies().then(() => {});
        } else {
            fetchCompanies().then(() => {});
        }
    }, [page]);

    useEffect(() => {
        const allEmpty = !searchCompanyName.trim();
        if (allEmpty) setSearchMode(false);
    }, [searchCompanyName]);

    const sorted = multiSort(companies);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout} />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input type="text" placeholder="고객사명 검색" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <button onClick={() => { setPage(0); searchCompanies(); }} > 검색하기 </button>
                </div>

                <div className="content-box">
                    <input
                        type="text"
                        placeholder="*고객사명"
                        value={newCompany.companyName}
                        onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="*고객사 주소"
                        value={newCompany.companyAddress}
                        onChange={(e) => setNewCompany({ ...newCompany, companyAddress: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="*담당자 ID"
                        value={newCompany.userId}
                        onChange={(e) => setNewCompany({ ...newCompany, userId: e.target.value })}
                    />
                    <button onClick={() => addCompany(newCompany)} >고객사 추가</button>
                </div>

                {/* Table */}
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><button onClick={() => toggleSort('companyId')}>고객사 ID{getSortIcon('companyId')}</button></th>
                                <th><button onClick={() => toggleSort('companyName')}>고객사명{getSortIcon('companyName')}</button></th>
                                <th><button onClick={() => toggleSort('companyAddress')}>고객사 주소{getSortIcon('companyAddress')}</button></th>
                                <th><button onClick={() => toggleSort('userName')}>담당자{getSortIcon('userName')}</button></th>
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((c) => (
                                <tr key={c.companyId}>
                                    <td>{c.companyId}</td>
                                    <td className="clicktable" onClick={() => { setSelectedCompany(c); fetchCompanyDetails(c.companyId); }}>{c.companyName}</td>
                                    <td>{c.companyAddress}</td>
                                    <td>{c.userName}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>
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

            {/* Slide Panel */}
            {selectedCompany && companyDetail && (
                <>
                    <div className="slide-overlay" onClick={() => { setSelectedCompany(null); setEditMode(false); }}></div>
                    <div className="slide-panel open">
                        <button className="slide-close-button" onClick={() => { setSelectedCompany(null); setEditMode(false); }}>×</button>
                        {detailLoading ? (
                            <p>로딩 중...</p>
                        ) : editMode ? (
                            <div className="container">
                                <form onSubmit={handleCompanyUpdate}>
                                    <h2>고객사 정보 수정</h2>
                                    <div className="form-row">
                                        <label>*고객사명</label>
                                        <input type="text" value={companyDetail.companyName} onChange={(e) => setCompanyDetail({ ...companyDetail, companyName: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <label>고객사 주소</label>
                                        <input type="text" value={companyDetail.companyAddress} onChange={(e) => setCompanyDetail({ ...companyDetail, companyAddress: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <label>*유저 ID</label>
                                        <input type="text" value={companyDetail.userId} onChange={(e) => setCompanyDetail({ ...companyDetail, userId: e.target.value })} />
                                    </div>
                                    <button type="submit">저장</button>
                                </form>
                            </div>
                        ) : (
                            <div className="container">
                                <h3>고객사 상세 정보</h3>
                                <div className="form-row"><label>고객사명</label><span>{companyDetail.companyName}</span></div>
                                <div className="form-row"><label>고객사 주소</label><span>{companyDetail.companyAddress}</span></div>
                                <div className="form-row"><label>담당자</label><span>{companyDetail.userName}</span></div>
                                <div className="form-row"><label>수정일</label><span>{new Date(companyDetail.updatedAt).toLocaleString()}</span></div>
                                <button className="nav-button" onClick={() => setEditMode(true)}>고객사 정보 수정하기</button>
                                <div className="container-delete">
                                    <span onClick={handleDelete} >고객사 정보 삭제하기</span>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <h3>고객사 소속 사원 목록</h3>
                                    {companyUsers.length === 0 ? (
                                        <p>등록된 사원이 없습니다.</p>
                                    ) : (
                                        <div className="history">
                                            <table className="table">
                                                <thead className="header">
                                                <tr>
                                                    <th>이름</th>
                                                    <th>전화번호</th>
                                                    <th>이메일</th>
                                                    <th>직급</th>
                                                    <th>부서</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {companyUsers.map((user) => (
                                                    <tr key={user.companyUserId}>
                                                        <td>{user.companyUserName}</td>
                                                        <td>{user.companyUserPhone}</td>
                                                        <td>{user.companyUserEmail}</td>
                                                        <td>{user.companyUserPosition}</td>
                                                        <td>{user.companyUserDivision}</td>
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

export default CompanyPage;
