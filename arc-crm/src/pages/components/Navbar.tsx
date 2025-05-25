import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/nav.css';

function Navbar({ onLogout }: { onLogout: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path ? 'nav-button active' : 'nav-button';

    return (
        <nav className="navbar">
            <div className="nav-left">
                <button onClick={onLogout} className="nav-button">로그아웃</button>
            </div>
            <div className="nav-right">
                <button onClick={() => navigate('/user')} className={isActive('/user')}>유저 페이지</button>
                <button onClick={() => navigate('/company')} className={isActive('/company')}>고객사 페이지</button>
                <button onClick={() => navigate('/company-user')} className={isActive('/company-user')}>고객사 사원 페이지</button>
                <button onClick={() => navigate('/deals')} className={isActive('/deals')}>영업 이력 페이지</button>
                <button onClick={() => navigate('/contacts')} className={isActive('/contacts')}>컨택 이력 페이지</button>
            </div>
        </nav>
    );
}

export default Navbar;
