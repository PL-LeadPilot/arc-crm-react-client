import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/nav.css';

function Navbar({ onLogout }: { onLogout: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [remainingTime, setRemainingTime] = useState<number | null>(null);

    const isActive = (path: string) => location.pathname === path ? 'nav-button active' : 'nav-button';

    const handleNavClick = (path: string) => {
        if (location.pathname === path) {
            window.location.reload();
        } else {
            navigate(path);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;

            const updateRemaining = () => {
                const now = Date.now();
                const diff = Math.max(0, exp - now);
                setRemainingTime(diff);
            };

            updateRemaining(); // 최초 1회 실행
            const interval = setInterval(updateRemaining, 1000); // 1초마다 갱신

            return () => clearInterval(interval); // 언마운트 시 정리
        } catch {
            setRemainingTime(null);
        }
    }, []);

    // mm:ss 포맷 변환
    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const seconds = String(totalSec % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <button onClick={onLogout} className="nav-button">로그아웃</button>
                {remainingTime !== null && (
                    <span className={`time-container ${remainingTime <= 300000 ? 'time-danger' : ''}`}>
                        남은 시간: {formatTime(remainingTime)}
                    </span>
                )}
            </div>
            <div className="nav-right">
                <button onClick={() => handleNavClick('/user')} className={isActive('/user')}>유저 페이지</button>
                <button onClick={() => handleNavClick('/company')} className={isActive('/company')}>고객사 페이지</button>
                <button onClick={() => handleNavClick('/company-user')} className={isActive('/company-user')}>고객사 사원 페이지</button>
                <button onClick={() => handleNavClick('/deal')} className={isActive('/deal')}>영업 이력 페이지</button>
                <button onClick={() => handleNavClick('/contact-history')} className={isActive('/contact-history')}>컨택 이력 페이지</button>
            </div>
        </nav>
    );
}

export default Navbar;
