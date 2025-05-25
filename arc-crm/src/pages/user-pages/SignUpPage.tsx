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
        const newErrors: Record<string, string> = {};

        if (!/^[a-zA-Z0-9]{3,20}$/.test(userId)) {
            newErrors.userId = '아이디는 3~20자 영문 또는 숫자여야 합니다.';
        }

        if (
            userPassword.length < 7 ||
            userPassword.length > 20 ||
            !/[a-zA-Z]/.test(userPassword) ||
            !/[0-9]/.test(userPassword)
        ) {
            newErrors.userPassword = '비밀번호는 영문과 숫자를 포함한 7~20자여야 합니다.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            newErrors.userEmail = '유효한 이메일 주소를 입력하세요.';
        }

        if (userName.trim().length < 2) {
            newErrors.userName = '이름은 2자 이상 입력하세요.';
        }

        if (!/^010-\d{4}-\d{4}$/.test(userPhone)) {
            newErrors.userPhone = '전화번호 형식은 010-0000-0000입니다.';
        }

        if (!userPosition.trim()) {
            newErrors.userPosition = '직책을 입력하세요.';
        }

        if (!userDivision.trim()) {
            newErrors.userDivision = '부서를 입력하세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
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
            setError('서버 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div className="nav-left">
                    <button onClick={handleLogout} className="nav-button">로그아웃</button>
                    <button onClick={handleGoToMyPage} className="nav-button">내 정보 보기</button>

                </div>
                <div className="nav-right" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleGoToUserPage} className="nav-button">유저 페이지</button>
                    <button onClick={handleGoToCompanyPage} className="nav-button">고객사 페이지</button>
                </div>
            </nav>
            <div className="container">
                <h2>회원가입</h2>
                <h4>*은 필수입니다.</h4>
                <form onSubmit={handleSignUp}>
                    {fieldErrors.userId && <p className="error">{fieldErrors.userId}</p>}
                    <div className="form-row">
                        <label htmlFor="userId">*아이디</label>
                        <input
                            id="userId"
                            type="text"
                            placeholder="3자 이상 20자 이하 영문/숫자"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPassword && <p className="error">{fieldErrors.userPassword}</p>}
                    <div className="form-row">
                        <label htmlFor="userPassword">*비밀번호</label>
                        <input
                            id="userPassword"
                            type="password"
                            placeholder="7자 이상 20자 이하 영문/숫자"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userEmail && <p className="error">{fieldErrors.userEmail}</p>}
                    <div className="form-row">
                        <label htmlFor="userEmail">*이메일</label>
                        <input
                            id="userEmail"
                            type="email"
                            placeholder="test@test.com"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userName && <p className="error">{fieldErrors.userName}</p>}
                    <div className="form-row">
                        <label htmlFor="userName">*이름</label>
                        <input
                            id="userName"
                            type="text"
                            placeholder="2자 이상 10자 이하"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPhone && <p className="error">{fieldErrors.userPhone}</p>}
                    <div className="form-row">
                        <label htmlFor="userPhone">*전화번호</label>
                        <input
                            id="userPhone"
                            type="text"
                            placeholder="*010-0000-0000"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userPosition && <p className="error">{fieldErrors.userPosition}</p>}
                    <div className="form-row">
                        <label htmlFor="userPosition">*직책</label>
                        <input
                            id="userPosition"
                            type="text"
                            placeholder="*직책"
                            value={userPosition}
                            onChange={(e) => setUserPosition(e.target.value)}
                            required
                        />
                    </div>

                    {fieldErrors.userDivision && <p className="error">{fieldErrors.userDivision}</p>}
                    <div className="form-row">
                        <label htmlFor="userDivision">*부서</label>
                        <input
                            id="userDivision"
                            type="text"
                            placeholder="*부서"
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
