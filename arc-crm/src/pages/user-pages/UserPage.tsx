import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/container.css'
import '../../styles/form.css'
import '../../styles/nav.css'
import '../../styles/page.css'
import '../../styles/table.css'

interface User {
    userName: string;
    userPhone: string;
    userEmail: string;
    userPosition: string;
    userDivision: string;
}

type SortKey = keyof User;

type SortState = {
    key: SortKey;
    order: 'asc' | 'desc';
};

function getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null;
    } catch {
        return null;
    }
}

function UserPage() {
    const navigate = useNavigate();
    const userRole = getUserRole();

    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortState, setSortState] = useState<SortState[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleGoToSignUp = () => navigate('/signup');
    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');
    const handleGoToMyPage = () => navigate('/user/me');

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

    const multiSort = (list: User[]) => {
        return [...list].sort((a, b) => {
            for (const { key, order } of sortState) {
                const aVal = a[key].toLowerCase();
                const bVal = b[key].toLowerCase();
                const cmp = aVal.localeCompare(bVal);
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/user?page=${page}&size=${ITEMS_PER_PAGE}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('유저 목록을 불러오지 못했습니다.');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page]);


    const sortedUsers = multiSort(users);

    return (
        <div className="page">
            <nav className="navbar">
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                    {userRole === 'ADMIN' && (
                        <button onClick={handleGoToSignUp} className="nav-button">유저 회원가입</button>
                    )}
                    <button onClick={handleGoToMyPage} className="nav-button">내 정보 보기</button>
                </div>
                <div className="nav-right">
                    <button onClick={handleGoToUserPage} className="nav-button active">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button">고객사 페이지</button>
                </div>
            </nav>

            <div className="content">
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><button onClick={() => toggleSort('userName')}>이름{getSortIcon('userName')}</button></th>
                                <th><button onClick={() => toggleSort('userEmail')}>이메일{getSortIcon('userEmail')}</button></th>
                                <th><button onClick={() => toggleSort('userPhone')}>전화번호{getSortIcon('userPhone')}</button></th>
                                <th><button onClick={() => toggleSort('userPosition')}>직책{getSortIcon('userPosition')}</button></th>
                                <th><button onClick={() => toggleSort('userDivision')}>부서{getSortIcon('userDivision')}</button></th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedUsers.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.userName}</td>
                                    <td>{user.userEmail}</td>
                                    <td>{user.userPhone}</td>
                                    <td>{user.userPosition}</td>
                                    <td>{user.userDivision}</td>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default UserPage;
