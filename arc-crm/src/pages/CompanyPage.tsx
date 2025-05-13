import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/container.css'
import '../styles/form.css'
import '../styles/nav.css'
import '../styles/page.css'
import '../styles/table.css'

interface Company {
    companyId: number;
    companyName: string;
    companyAddress: string;
    userId: string;
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
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');

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

    const multiSort = (list: Company[]) => {
        if (!Array.isArray(list)) return [];
        return [...list].sort((a, b) => {
            for (const { key, order } of sortState) {
                const aVal = a[key].toString().toLowerCase();
                const bVal = b[key].toString().toLowerCase();
                const cmp = aVal.localeCompare(bVal);
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    };

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/company?page=${page}&size=${ITEMS_PER_PAGE}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            if (!response.ok) throw new Error('고객사 정보를 불러오지 못했습니다.');
            const data = await response.json();
            if (!Array.isArray(data.content)) throw new Error('받은 데이터가 json이 아닙니다.');
            setCompanies(data.content);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const searchCompanies = async () => {
        if (!search.trim()) {
            fetchCompanies();
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/company/search?companyName=${encodeURIComponent(search)}&page=0`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('검색에 실패했습니다.');
            const data = await response.json();
            if (!Array.isArray(data.content)) throw new Error('받은 데이터가 배열 형식이 아닙니다.');
            setCompanies(data.content);
            setTotalPages(data.totalPages);
            setPage(0);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const addCompany = async (companyData: { companyName: string; companyAddress: string }) => {
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

            if (!response.ok) {
                throw new Error('고객사 등록에 실패했습니다.');
            }

            const result = await response.json();
            console.log('고객사 등록 완료:', result);

            // 등록 후 필요한 후처리 (예: 목록 갱신)
            await fetchCompanies();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [page]);

    const sorted = multiSort(companies);

    return (
        <div className="page">
            <nav className="navbar">
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                </div>
                <div className="nav-right">
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button active">고객사 페이지</button>
                </div>
            </nav>

            <div className="content">
                <h2></h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="고객사명 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '5px' }}
                    />
                    <button onClick={searchCompanies} className="nav-button">검색하기</button>
                    <button onClick={() => addCompany({ companyName: '', companyAddress: '' })} className="nav-button">고객사 추가</button>
                </div>
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>
                                    <button onClick={() => toggleSort('companyName')}>
                                        이름{getSortIcon('companyName')}
                                    </button>
                                </th>
                                <th>
                                    <button onClick={() => toggleSort('companyAddress')}>
                                        주소{getSortIcon('companyAddress')}
                                    </button>
                                </th>
                                <th>
                                    <button onClick={() => toggleSort('userId')}>
                                        담당 유저 ID{getSortIcon('userId')}
                                    </button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((c) => (
                                <tr key={c.companyId}>
                                    <td>{c.companyName}</td>
                                    <td>{c.companyAddress}</td>
                                    <td>{c.userId}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="pagination" style={{ marginTop: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                            {/* 이전 페이지 */}
                            <button
                                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                                disabled={page === 0}
                                className="page-button"
                            >
                                &lt;
                            </button>

                            {/* 페이지 숫자들 */}
                            {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                                // 항상 보여줄 페이지
                                if (
                                    i === 0 || // 첫 페이지
                                    i === totalPages - 1 || // 마지막 페이지
                                    Math.abs(i - page) <= 1 // 현재 페이지 기준 ±1
                                ) {
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

                                // 점(...) 표시 (중복 방지)
                                if (
                                    (i === 1 && page > 3) || // 앞쪽 점
                                    (i === totalPages - 2 && page < totalPages - 4) || // 뒤쪽 점
                                    (Math.abs(i - page) === 2)
                                ) {
                                    return <span key={i} className="page-dots">...</span>;
                                }

                                return null; // 나머지는 안 보여줌
                            })}

                            {/* 다음 페이지 */}
                            <button
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                                disabled={page === totalPages - 1}
                                className="page-button"
                            >
                                &gt;
                            </button>
                        </div>

                    </>
                )}
            </div>
        </div>
    );
}

export default CompanyPage;
