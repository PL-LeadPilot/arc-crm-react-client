import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserPage.css';

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

    return (
        <div className="user-page">
            <nav className="navbar">
                <div className="nav-left">
                    {userRole === 'ADMIN' && (
                        <button onClick={handleGoToSignUp} className="nav-button">회원가입</button>
                    )}
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                </div>
                <div className="nav-right">
                    <button onClick={handleGoToCompany} className="nav-button">고객사 페이지</button>
                </div>
            </nav>

            <div className="user-content">
                <p>유저 리스트 기능이 들어갑니다.</p>
            </div>
        </div>
    );
}

export default UserPage;
