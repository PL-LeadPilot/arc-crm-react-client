import React, {JSX} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/user-pages/LoginPage';
import SignUpPage from './pages/user-pages/SignUpPage';
import CompanyPage from './pages/CompanyPage';
import CompanyUserPage from './pages/CompanyUserPage';
import DealPage from './pages/DealPage'
import UserPage from './pages/user-pages/UserPage';
import MyInfoPage from './pages/user-pages/MyInfoPage';
import EditMyInfoPage from './pages/user-pages/EditMyInfoPage';


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
    return (
        <Routes>
            <Route path="/login" element={<PublicOnlyRoute element={<LoginPage />} />} />
            <Route path="/signup" element={<AdminRoute element={<SignUpPage />} />} />
            <Route path="/company" element={<PrivateRoute element={<CompanyPage />} />} />
            <Route path="/company-user" element={<PrivateRoute element={<CompanyUserPage />} />} />
            <Route path="/deals" element={<PrivateRoute element={<DealPage />} />} />
            <Route path="/user" element={<PrivateRoute element={<UserPage />} />} />
            <Route path="/user/me" element={<PrivateRoute element={<MyInfoPage />} />} />
            <Route path="/user/me/edit" element={<PrivateRoute element={<EditMyInfoPage />} />} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;