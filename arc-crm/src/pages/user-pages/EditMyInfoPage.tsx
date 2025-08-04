import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/container.css'
import '../../styles/form.css'
import '../../styles/nav.css'
import '../../styles/page.css'
import '../../styles/table.css'

function EditMyInfoPage() {
    const navigate = useNavigate();

    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPosition, setUserPosition] = useState('');
    const [userDivision, setUserDivision] = useState('');
    const [userCurrentPassword, setUserCurrentPassword] = useState('');
    const [userNewPassword, setUserNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

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
        };
        fetchMyInfo();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const errors: Record<string, string> = {};

        if (!userCurrentPassword) { errors.userCurrentPassword = '현재 비밀번호는 필수';}
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) { errors.userEmail = '이메일 형식: exam@example.com'; }
        if (userName.trim().length < 2 || userName.trim().length > 20) { errors.userName = '이름: 2~20자 문자'; }
        if (!/^010-\d{4}-\d{4}$/.test(userPhone)) { errors.userPhone = '전화번호 형식: 010-0000-0000'; }
        if (userDivision.trim().length > 31) { errors.userDivision = '직책: 최대 30자 문자'; }
        if (userPosition.trim().length < 1 || userPosition.trim().length > 31) { errors.userPosition = '부서: 최대 30자 문자'; }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userCurrentPassword,
                    userNewPassword,
                    userName,
                    userPhone,
                    userEmail,
                    userPosition,
                    userDivision,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const firstErrorMsg = Object.values(errorData)[0];
                setError(typeof firstErrorMsg === 'string' ? firstErrorMsg : '수정 실패');
            } else {
                navigate('/user/me');
            }
        } catch {
            setError('서버 오류 발생');
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                </div>
                <div className="nav-right">
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button">고객사 페이지</button>
                </div>
            </nav>
            <div className="container">
                <h3>유저 상세정보 수정</h3>
                <form onSubmit={handleUpdate}>
                    {fieldErrors.userCurrentPassword && <p className="error">{fieldErrors.userCurrentPassword}</p>}
                    <div className="form-row">
                        <label htmlFor="userCurrentPassword">*현재 비밀번호</label>
                        <input
                            type="password"
                            placeholder="입력하셔야 수정됩니다."
                            value={userCurrentPassword}
                            onChange={(e) => setUserCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="userNewPassword">새 비밀번호 (선택)</label>
                        <input
                            type="password"
                            placeholder="7~20자 (영문+숫자)"
                            value={userNewPassword}
                            onChange={(e) => setUserNewPassword(e.target.value)}
                        />
                    </div>

                    {fieldErrors.userEmail && <p className="error">{fieldErrors.userEmail}</p>}
                    <div className="form-row">
                        <label htmlFor="userEmail">*이메일</label>
                        <input
                            type="email"
                            placeholder="exam@example.com"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userName && <p className="error">{fieldErrors.userName}</p>}
                    <div className="form-row">
                        <label htmlFor="userName">*이름</label>
                        <input
                            type="text"
                            placeholder="2~20자 문자"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPhone && <p className="error">{fieldErrors.userPhone}</p>}
                    <div className="form-row">
                        <label htmlFor="userPhone">*전화번호</label>
                        <input
                            type="text"
                            placeholder="*010-0000-0000"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPosition && <p className="error">{fieldErrors.userPosition}</p>}
                    <div className="form-row">
                        <label htmlFor="userPosition">직책</label>
                        <input
                            type="text"
                            placeholder="최대 30자"
                            value={userPosition}
                            onChange={(e) => setUserPosition(e.target.value)}
                        />
                    </div>

                    {fieldErrors.userDivision && <p className="error">{fieldErrors.userDivision}</p>}
                    <div className="form-row">
                        <label htmlFor="userDivision">*부서</label>
                        <input
                            type="text"
                            placeholder="최대 30자"
                            value={userDivision}
                            onChange={(e) => setUserDivision(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit">저장</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        </>
    );
}

export default EditMyInfoPage;
