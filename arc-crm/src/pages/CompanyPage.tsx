import React, {useCallback, useEffect, useState} from 'react';
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
    const [sortState, setSortState] = useState<SortState>({
        key: 'companyName',
        order: 'asc',
    });
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
    const [showAddForm, setShowAddForm] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    const Sort = (list: Company[]) => {
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

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/company?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('고객사 조회 실패');

            const data = await response.json();
            setCompanies(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [page]);

    const fetchCompanyDetails = async (companyId: number) => {
        setDetailLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/company/companyDetails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({companyId})
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 상세정보 조회 실패');
            }

            const data = await response.json();
            setCompanyDetail(data);
            await fetchCompanyUsersByCompany(companyId);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const searchCompanies = useCallback(async () => {
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

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '검색 실패');
            }

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
    }, [page, searchCompanyName, fetchCompanies]);

    const validateCompanyInput = (company: { companyName: string; companyAddress: string; userId: string }) => {
        const errors: Record<string, string> = {};

        if (!company.companyName.trim()) {
            errors.companyName = '고객사명 필수';
        } else if (company.companyName.length > 30) {
            errors.companyName = '고객사명: 최대 30자';
        }

        if (company.companyAddress.length > 60) { errors.companyAddress = '고객사 주소: 최대 60자'; }

        if (!company.userId.trim()) {
            errors.userId = '유저 ID 필수';
        } else if (!/^[a-zA-Z0-9]{3,20}$/.test(company.userId)) {
            errors.userId = '유저 ID: 3~20자 (영문 or 숫자)'
        }

        return errors;
    };


    const addCompany = async (companyData: {
        companyName: string;
        companyAddress: string;
        userId: string
    }) => {
        const errors = validateCompanyInput(companyData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});

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

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 등록 실패');
            }

            alert('고객사 등록 성공');
            await fetchCompanies();
            setShowAddForm(false);
            setNewCompany(initialCompanyState);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleCompanyUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyDetail) return;

        const errors = validateCompanyInput(companyDetail);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/company', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(companyDetail),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 상세정보 수정 실패');
            }

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
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyId: companyDetail.companyId,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || '고객사 삭제 실패');
            }

            alert('고객사 삭제 성공');
            setSelectedCompany(null);
            setCompanyDetail(null);
            setEditMode(false);
            await fetchCompanies();
        } catch (err) {
            alert((err as Error).message);
        }
    };

    const fetchCompanyUsersByCompany = async (companyId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/companyUser/byCompany', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyId }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage ||'고객사 사원 조회 실패');
            }

            const data = await response.json();
            setCompanyUsers(data);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        }
    }

    useEffect(() => {
        if (searchMode) {
            searchCompanies().then(() => {});
        } else {
            fetchCompanies().then(() => {});
        }
    }, [page, searchMode, fetchCompanies, searchCompanies]);

    useEffect(() => {
        const allEmpty = !searchCompanyName.trim();
        if (allEmpty) setSearchMode(false);
    }, [searchCompanyName]);

    const sorted = Sort(companies);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout} />
            {/* Search + Add */}
            <div className="content">
                <div className="content-box">
                    <input type="text" placeholder="고객사명" value={searchCompanyName} onChange={(e) => setSearchCompanyName(e.target.value)} />
                    <button type="button" onClick={() => { setPage(0); searchCompanies(); }} > 검색 </button>
                    <button type="button" onClick={() => setShowAddForm(true)}>고객사 등록</button>
                </div>

                {showAddForm && (
                    <div className="overlay">
                        <div className="container">
                            <h3>고객사 등록</h3>
                            {fieldErrors.companyName && <p className="error">{fieldErrors.companyName}</p>}
                            <div className="form-row"><label>*고객사명</label><input type="text" placeholder="최대 30자" value={newCompany.companyName} onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}/></div>

                            {fieldErrors.companyAddress && <p className="error">{fieldErrors.companyAddress}</p>}
                            <div className="form-row"><label>고객사 주소</label><input type="text" placeholder="최대 60자" value={newCompany.companyAddress} onChange={(e) => setNewCompany({ ...newCompany, companyAddress: e.target.value })}/></div>

                            {fieldErrors.userId && <p className="error">{fieldErrors.userId}</p>}
                            <div className="form-row"><label>*담당자 ID</label><input type="text" value={newCompany.userId} onChange={(e) => setNewCompany({ ...newCompany, userId: e.target.value })}/></div>
                            <div className="form-row">
                                <button type="button" className="nav-button" onClick={() => addCompany(newCompany)}>등록</button>
                                <button type="button" className="nav-button" onClick={() => {setShowAddForm(false); setNewCompany(initialCompanyState); setFieldErrors({}); }}>취소</button>
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
                                <th><button onClick={() => toggleSort('companyId')}>고객사 ID{getSortIcon('companyId')}</button></th>
                                <th><button onClick={() => toggleSort('companyName')}>고객사명{getSortIcon('companyName')}</button></th>
                                <th><button onClick={() => toggleSort('companyAddress')}>고객사 주소{getSortIcon('companyAddress')}</button></th>
                                <th><button onClick={() => toggleSort('userName')}>담당자{getSortIcon('userName')}</button></th>
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((company) => (
                                <tr
                                    key={company.companyId}
                                    className={`open-slide-panel ${selectedCompany?.companyId === company.companyId ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCompany(company);
                                        fetchCompanyDetails(company.companyId);
                                    }}
                                >
                                    <td>{company.companyId}</td>
                                    <td>{company.companyName}</td>
                                    <td>{company.companyAddress}</td>
                                    <td>{company.userName}</td>
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
                                                <h3>고객사 상세정보 수정</h3>
                                                <div className="form-row"><label>고객사 ID</label><span>{selectedCompany!.companyId}</span></div>

                                                {fieldErrors.companyName && <p className="error">{fieldErrors.companyName}</p>}
                                                <div className="form-row"><label>*고객사명</label><input type="text" placeholder="최대 30자" value={companyDetail.companyName} onChange={(e) => setCompanyDetail({ ...companyDetail, companyName: e.target.value })} /></div>

                                                {fieldErrors.companyAddress && <p className="error">{fieldErrors.companyAddress}</p>}
                                                <div className="form-row"><label>고객사 주소</label><input type="text" placeholder="최대 60자" value={companyDetail.companyAddress} onChange={(e) => setCompanyDetail({ ...companyDetail, companyAddress: e.target.value })} /></div>

                                                {fieldErrors.userId && <p className="error">{fieldErrors.userId}</p>}
                                                <div className="form-row"><label>*유저 ID</label><input type="text" value={companyDetail.userId} onChange={(e) => setCompanyDetail({ ...companyDetail, userId: e.target.value })} /></div>
                                                <div className="form-row">
                                                    <button type="submit" className="nav-button">저장</button>
                                                    <button
                                                        type="button"
                                                        className="nav-button"
                                                        onClick={() => {
                                                            setEditMode(false);
                                                            setCompanyDetail(null);
                                                            setFieldErrors({});
                                                        }}
                                                    >취소
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="container">
                                            <h3>고객사 상세정보</h3>
                                            <div className="form-row"><label>고객사 ID</label><span>{selectedCompany!.companyId}</span></div>
                                            <div className="form-row"><label>고객사명</label><span>{companyDetail.companyName}</span></div>
                                            <div className="form-row"><label>고객사 주소</label><span>{companyDetail.companyAddress}</span></div>
                                            <div className="form-row"><label>담당자</label><span>{companyDetail.userName}</span></div>
                                            <div className="form-row"><label>수정일</label><span>{new Date(companyDetail.updatedAt).toLocaleString()}</span></div>
                                            <button type="button" className="nav-button" onClick={() => setEditMode(true)}>수정</button>
                                            <div className="container-delete">
                                                <span onClick={handleDelete} >고객사 삭제</span>
                                            </div>
                                            <div className="container-contain">
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
                                                            {companyUsers.map((companyUser) => (
                                                                <tr key={companyUser.companyUserEmail}>
                                                                    <td>{companyUser.companyUserName}</td>
                                                                    <td>{companyUser.companyUserPhone}</td>
                                                                    <td>{companyUser.companyUserEmail}</td>
                                                                    <td>{companyUser.companyUserPosition}</td>
                                                                    <td>{companyUser.companyUserDivision}</td>
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

export default CompanyPage;
