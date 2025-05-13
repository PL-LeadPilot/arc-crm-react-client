import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/user-styles/SignUpPage.css';

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
        const newErrors: Record<string, string> = {};

        if (!userCurrentPassword) {
            newErrors.userCurrentPassword = '현재 비밀번호는 필수입니다.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            newErrors.userEmail = '유효한 이메일 주소를 입력하세요.';
        }

        if (!/^010-\d{4}-\d{4}$/.test(userPhone)) {
            newErrors.userPhone = '전화번호 형식은 010-0000-0000입니다.';
        }

        if (!userName.trim()) {
            newErrors.userName = '이름을 입력하세요.';
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
            setError('서버 오류가 발생했습니다.');
        }
    };

    return (
        <div className="signup-container">
            <h2>내 정보 수정</h2>
            <form onSubmit={handleUpdate}>
                {fieldErrors.userCurrentPassword && <p className="error">{fieldErrors.userCurrentPassword}</p>}
                <div className="form-row">
                    <label htmlFor="userCurrentPassword">*현재 비밀번호</label>
                    <input
                        id="userCurrentPassword"
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
                        id="userNewPassword"
                        type="password"
                        placeholder="7자 이상 20자 이하 영문/숫자"
                        value={userNewPassword}
                        onChange={(e) => setUserNewPassword(e.target.value)}
                    />
                </div>

                {fieldErrors.userEmail && <p className="error">{fieldErrors.userEmail}</p>}
                <div className="form-row">
                    <label htmlFor="userEmail">이메일</label>
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
                    <label htmlFor="userName">이름</label>
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
                    <label htmlFor="userPhone">전화번호</label>
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
                    <label htmlFor="userPosition">직책</label>
                    <input
                        id="userPosition"
                        type="text"
                        value={userPosition}
                        onChange={(e) => setUserPosition(e.target.value)}
                        required
                    />
                </div>

                {fieldErrors.userDivision && <p className="error">{fieldErrors.userDivision}</p>}
                <div className="form-row">
                    <label htmlFor="userDivision">부서</label>
                    <input
                        id="userDivision"
                        type="text"
                        value={userDivision}
                        onChange={(e) => setUserDivision(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">수정 완료</button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
}

export default EditMyInfoPage;
