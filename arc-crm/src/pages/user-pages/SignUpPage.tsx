import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/container.css'
import '../../styles/form.css'
import '../../styles/nav.css'
import '../../styles/page.css'
import '../../styles/table.css'

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp && currentTime < payload.exp;
    } catch {
        return false;
    }
}

function SignUpPage() {
    const [userId, setUserId] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userRole, setUserRole] = useState('SALES');
    const [userPosition, setUserPosition] = useState('');
    const [userDivision, setUserDivision] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isTokenValid(token)) {
            localStorage.removeItem('token');
            navigate('/');
            return;
        }

        try {
            const payload = JSON.parse(atob(token!.split('.')[1]));
            const role = payload.role;

            if (role === 'SALES') {
                alert('접근할 수 없는 페이지입니다.');
                navigate('/company');
            }
        } catch {
            localStorage.removeItem('token');
            navigate('/');
        }
    }, [navigate]);

    const handleGoToUserPage = () => navigate('/user');
    const handleGoToCompanyPage = () => navigate('/company');
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };
    const handleGoToMyPage = () => navigate('/user/me');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const errors: Record<string, string> = {};

        if (!/^[a-zA-Z0-9]{3,20}$/.test(userId)) { errors.userId = '아이디: 3~20자 (영문 or 숫자)'; }
        if (
            userPassword.length < 7 ||
            userPassword.length > 20 ||
            !/[a-zA-Z]/.test(userPassword) ||
            !/[0-9]/.test(userPassword)
        ) {
            errors.userPassword = '비밀번호: 7~20자 (영문 + 숫자)';
        }
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

            const response = await fetch('/admin/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    userPassword,
                    userEmail,
                    userName,
                    userPhone,
                    userRole,
                    userPosition,
                    userDivision,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const firstErrorMsg = Object.values(errorData)[0];
                setError(typeof firstErrorMsg === 'string' ? firstErrorMsg : '회원가입 실패');
            } else {
                navigate('/company');
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
                    <button onClick={handleGoToMyPage} className="nav-button">내 정보 보기</button>

                </div>
                <div className="nav-right">
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button">고객사 페이지</button>
                </div>
            </nav>
            <div className="container">
                <h2>회원가입</h2>
                <h4>*은 필수</h4>
                <form onSubmit={handleSignUp}>
                    {fieldErrors.userId && <p className="error">{fieldErrors.userId}</p>}
                    <div className="form-row">
                        <label htmlFor="userId">*아이디</label>
                        <input
                            type="text"
                            placeholder="3~20자 (영문 or 숫자)"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPassword && <p className="error">{fieldErrors.userPassword}</p>}
                    <div className="form-row">
                        <label htmlFor="userPassword">*비밀번호</label>
                        <input
                            type="password"
                            placeholder="7~20자 (영문 + 숫자)"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            required
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

                    <div className="form-row">
                        <label htmlFor="userRole">*권한</label>
                        <select
                            id="userRole"
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value)}
                            required
                        >
                            <option value="SALES">SALES (default)</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    <button type="submit">회원가입</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        </>
    );
}

export default SignUpPage;
