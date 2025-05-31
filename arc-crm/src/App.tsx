import React, { JSX, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/user-pages/LoginPage';
import SignUpPage from './pages/user-pages/SignUpPage';
import UserPage from './pages/user-pages/UserPage';
import MyInfoPage from './pages/user-pages/MyInfoPage';
import EditMyInfoPage from './pages/user-pages/EditMyInfoPage';
import CompanyPage from './pages/CompanyPage';
import CompanyUserPage from './pages/CompanyUserPage';
import DealPage from './pages/DealPage'
import ContactHistoryPage from "./pages/ContactHistoryPage";

// 유효성 체크
const isTokenValid = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp && Math.floor(Date.now() / 1000) < payload.exp;
    } catch {
        return false;
    }
};

const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null;
    } catch {
        return null;
    }
};

const PrivateRoute = ({ element }: { element: JSX.Element }) =>
    isTokenValid() ? element : <Navigate to="/login" />;

const PublicOnlyRoute = ({ element }: { element: JSX.Element }) =>
    isTokenValid() ? <Navigate to="/company" /> : element;

const AdminRoute = ({ element }: { element: JSX.Element }) =>
    isTokenValid() && getUserRole() === 'ADMIN' ? element : <Navigate to="/company" />;

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // ms 단위
            const now = Date.now();
            const timeout = exp - now;

            if (timeout > 0) {
                const timer = setTimeout(() => {
                    localStorage.removeItem('token');
                    alert('세션이 만료되어 로그인 페이지로 이동합니다.');
                    navigate('/login');
                }, timeout);

                return () => clearTimeout(timer); // 언마운트 시 타이머 정리
            } else {
                // 이미 만료
                localStorage.removeItem('token');
                navigate('/login');
            }
        } catch {
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/login" element={<PublicOnlyRoute element={<LoginPage />} />} />
            <Route path="/signup" element={<AdminRoute element={<SignUpPage />} />} />
            <Route path="/user" element={<PrivateRoute element={<UserPage />} />} />
            <Route path="/user/me" element={<PrivateRoute element={<MyInfoPage />} />} />
            <Route path="/user/me/edit" element={<PrivateRoute element={<EditMyInfoPage />} />} />
            <Route path="/company" element={<PrivateRoute element={<CompanyPage />} />} />
            <Route path="/company-user" element={<PrivateRoute element={<CompanyUserPage />} />} />
            <Route path="/deal" element={<PrivateRoute element={<DealPage />} />} />
            <Route path="/contact-history" element={<PrivateRoute element={<ContactHistoryPage />} />} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;