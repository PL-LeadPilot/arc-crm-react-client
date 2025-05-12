import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

function LoginPage() {
    const [userId, setUserId] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userPassword }),
        });

        if (!response.ok) {
            if (response.status === 403) {
                setError('아이디 또는 비밀번호가 틀렸습니다.');
            } else {
                setError('서버 에러가 발생했습니다.');
            }
        } else {
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            navigate('/company');
        }
    };

    return (
        <div className="login-container">
            <h2>로그인</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="패스워드"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    required
                />
                <button type="submit">로그인</button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
}

export default LoginPage;