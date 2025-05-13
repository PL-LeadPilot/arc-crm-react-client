import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserPage.css';

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleGoToSignUp = () => {
        navigate('/signup');
    };

    const handleGoToCompany = () => {
        navigate('/company');
    };

    const handleGoToMyPage = () => {
        navigate('/user/me');
    };

    const toggleSort = (key: SortKey) => {
        setSortState((prev) => {
            const existing = prev.find((s) => s.key === key);
            const nextOrder = !existing || existing.order === 'desc' ? 'asc' : 'desc';
            const newSort: SortState = { key, order: nextOrder as 'asc' | 'desc' };
            return [newSort, ...prev.filter((s) => s.key !== key)];
        });
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
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('/user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },

                });
                if (!response.ok) throw new Error('유저 목록을 불러오지 못했습니다.');
                const data = await response.json();
                console.log(data); //
                setUsers(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const sortedUsers = multiSort(users);

    return (
        <div className="user-page">
            <nav className="navbar">
                <div className="nav-left">
                    {userRole === 'ADMIN' && (
                        <button onClick={handleGoToSignUp} className="nav-button">회원가입</button>
                    )}
                    <button onClick={handleGoToMyPage} className="nav-button">내 정보 보기</button>
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                </div>
                <div className="nav-right">
                    <button onClick={handleGoToCompany} className="nav-button">고객사 페이지</button>
                </div>
            </nav>

            <div className="user-content">
                {loading && <p>로딩 중...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && (
                    <table className="user-table">
                        <thead>
                        <tr>
                            <th><button onClick={() => toggleSort('userName')}>이름</button></th>
                            <th><button onClick={() => toggleSort('userEmail')}>이메일</button></th>
                            <th><button onClick={() => toggleSort('userPhone')}>전화번호</button></th>
                            <th><button onClick={() => toggleSort('userPosition')}>직책</button></th>
                            <th><button onClick={() => toggleSort('userDivision')}>부서</button></th>
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
                )}
            </div>
        </div>
    );
}

export default UserPage;
