import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CompanyPage.css';

function CompanyPage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleGoToUserPage = () => {
        navigate('/user');
    };

    return (
        <div className="company-page">
            <nav className="navbar">
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                </div>
                <div className="nav-right" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                </div>
            </nav>

            <div className="company-content">
                <h2>Company Page</h2>
                <p>여기에 고객사 리스트나 기능이 들어갑니다.</p>
            </div>
        </div>
    );
}

export default CompanyPage;