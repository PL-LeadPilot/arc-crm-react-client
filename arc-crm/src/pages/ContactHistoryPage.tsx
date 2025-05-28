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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

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

    const searchContacts = async () => {
        const noSearch = !searchCompanyName && !searchCompanyUserName && !searchUserName && !searchDealName;
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
                    <button onClick={() => { setPage(0); searchContacts(); }}>검색하기</button>
                </div>

                {/* Table */}
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <table className="table">
                        <thead>
                        <tr>
                            <th><button onClick={() => toggleSort('contactId')}>ID{getSortIcon('contactId')}</button></th>
                            <th><button onClick={() => toggleSort('userName')}>담당자{getSortIcon('userName')}</button></th>
                            <th><button onClick={() => toggleSort('contactType')}>유형{getSortIcon('contactType')}</button></th>
                            <th><button onClick={() => toggleSort('contactResult')}>결과{getSortIcon('contactResult')}</button></th>
                            <th><button onClick={() => toggleSort('contactPercentage')}>성공률{getSortIcon('contactPercentage')}</button></th>
                            <th><button onClick={() => toggleSort('contactAt')}>컨택 일자{getSortIcon('contactAt')}</button></th>
                        </tr>
                        </thead>
                        <tbody>
                        {sorted.map((c) => (
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
        </div>
    );
}

export default ContactHistoryPage;
