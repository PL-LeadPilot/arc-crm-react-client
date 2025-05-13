import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SignUpPage.css';

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
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isTokenValid(token)) {
            localStorage.removeItem('token');
            navigate('/');
            return;
        }

        // 권한 검사 추가
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


    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/admin/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    userPassword,
                    userEmail,
                    userName,
                    userPhone,
                    userRole,
                    userPosition,
                    userDivision
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const firstErrorMsg = Object.values(errorData)[0]; // 첫 번째 에러만 표시
                setError(typeof firstErrorMsg === 'string' ? firstErrorMsg : '회원가입 실패');
            } else {
                navigate('/company');
            }
        } catch {
            setError('서버 오류가 발생했습니다.');
        }
    };

    return (
        <div className="signup-container">
            <h2>회원가입</h2>
            <h4>*은 필수입니다.</h4>
            <form onSubmit={handleSignUp}>
                <input type="text" placeholder="*아이디(3자 이상 20자 이하 영문 or 숫자)" value={userId} onChange={(e) => setUserId(e.target.value)} required />

                <input type="password" placeholder="*패스워드(7자 이상 20자 이하 영문 포함 숫자" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />

                <input type="email" placeholder="이메일(test@test.com)" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />

                <input type="text" placeholder="*이름" value={userName} onChange={(e) => setUserName(e.target.value)} required />

                <input type="text" placeholder="*전화번호(010-0000-0000)" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} required />

                <input type="text" placeholder="*직책" value={userPosition} onChange={(e) => setUserPosition(e.target.value)} required />

                <input type="text" placeholder="*부서" value={userDivision} onChange={(e) => setUserDivision(e.target.value)} required />

                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} required>
                    <option value="SALES">SALES (default)</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <button type="submit">회원가입</button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
}

export default SignUpPage;
