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
    const [sortState, setSortState] = useState<SortState>({
        key: 'userName',
        order: 'asc',
    });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const handleGoToSignUp = () => navigate('/signup');
    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');
    const handleGoToMyPage = () => navigate('/user/me');
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

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

    const Sort = (list: User[]) => {
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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/user?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('유저 정보를 불러오는데 실패했습니다.');
            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers().then(() => {});
    }, [page]);

    const sorted = Sort(users);

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
                            {sorted.map((user) => (
                                <tr key={user.userName}>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default UserPage;
