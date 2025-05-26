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
    source: string;
    status: string;
    dealAt: string;
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
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

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

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/deal?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('영업 이력을 불러오지 못했습니다.');

            const data = await response.json();
            if (!Array.isArray(data.content)) throw new Error('받은 데이터가 배열이 아닙니다.');
            setDeals(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [page]);

    const sortedDeals = multiSort(deals);

    return (
        <div className="page">
            {/* Nav */}
            <Navbar onLogout={handleLogout} />


            <div className="content">
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
                            <th><button onClick={() => toggleSort('source')}>영업 경로{getSortIcon('source')}</button></th>
                            <th><button onClick={() => toggleSort('status')}>영업 상태{getSortIcon('status')}</button></th>
                            <th><button onClick={() => toggleSort('dealAt')}>영업 날짜{getSortIcon('dealAt')}</button></th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedDeals.map((deal) => (
                            <tr key={deal.dealId}>
                                <td>{deal.dealId}</td>
                                <td>{deal.dealName}</td>
                                <td>{deal.companyId}</td>
                                <td>{deal.companyUserId}</td>
                                <td>{deal.userName}</td>
                                <td>{deal.source}</td>
                                <td>{deal.status}</td>
                                <td>{new Date(deal.dealAt).toLocaleDateString()}</td>
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
        </div>
    );
}

export default DealPage;