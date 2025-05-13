import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/container.css'
import '../../styles/form.css'
import '../../styles/nav.css'
import '../../styles/page.css'
import '../../styles/table.css'

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

function MyInfoPage() {
    const navigate = useNavigate();
    const userRole = getUserRole();

    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPosition, setUserPosition] = useState('');
    const [userDivision, setUserDivision] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');

    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem('token');
            const response = await fetch('/user/myInfo', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) return;
            const data = await response.json();
            setUserName(data.userName);
            setUserPhone(data.userPhone);
            setUserEmail(data.userEmail);
            setUserPosition(data.userPosition);
            setUserDivision(data.userDivision);
            setUpdatedAt(data.updatedAt);
        };
        fetchMyInfo();
    }, []);

    const handleGoToSignUp = () => navigate('/signup');
    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');
    const handleGoToEdit = () => navigate('/user/me/edit');
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleDelete = async () => {
        const confirm = window.confirm('정말 탈퇴하시겠습니까?');
        if (!confirm) return;

        const password = prompt('비밀번호를 입력하세요');
        if (!password) return;

        const token = localStorage.getItem('token');
        const response = await fetch('/user', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userPassword: password }),
        });

        if (response.ok) {
            alert('탈퇴가 완료되었습니다.');
            localStorage.removeItem('token');
            navigate('/');
        } else {
            alert('비밀번호가 일치하지 않거나 탈퇴에 실패했습니다.');
        }
    };

    return (
        <>
            <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                    {userRole === 'ADMIN' && (
                        <button onClick={handleGoToSignUp} className="nav-button">유저 회원가입</button>
                    )}
                </div>
                <div className="nav-right" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button">고객사 페이지</button>
                </div>
            </nav>
            <div className="signup-container">
                <h2>내 정보 보기</h2>
                <div className="form-row"><label>이름</label><span>{userName}</span></div>
                <div className="form-row"><label>전화번호</label><span>{userPhone}</span></div>
                <div className="form-row"><label>이메일</label><span>{userEmail}</span></div>
                <div className="form-row"><label>직책</label><span>{userPosition}</span></div>
                <div className="form-row"><label>부서</label><span>{userDivision}</span></div>
                <div className="form-row"><label>수정일</label><span>{updatedAt}</span></div>
                <button onClick={handleGoToEdit} className="nav-button">수정</button>
                <div style={{ textAlign: 'right', padding: '10px' }}>
                    <span
                        onClick={handleDelete}
                        style={{ fontSize: '0.8rem', color: 'gray', textDecoration: 'underline', cursor: 'pointer' }}>
                        탈퇴하기
                    </span>
                </div>
            </div>

        </>
    );
}

export default MyInfoPage;
