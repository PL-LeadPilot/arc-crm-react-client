import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import UserPage from '../../pages/user-pages/UserPage';

// navigate 모킹
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// 역할 기반 JWT 생성 함수
const createJwt = (role: 'ADMIN' | 'SALES') => [
    'header',
    btoa(JSON.stringify({ role, exp: 9999999999 })),
    'signature',
].join('.');

afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe('UserPage', () => {
    it('ADMIN은 회원가입 버튼을 볼 수 있다', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<UserPage />, { wrapper: MemoryRouter });

        expect(screen.getByText('유저 회원가입')).toBeInTheDocument();
        expect(screen.getByText('로그아웃')).toBeInTheDocument();
        expect(screen.getByText('고객사 페이지')).toBeInTheDocument();
        expect(screen.getByText('내 정보 보기')).toBeInTheDocument();
    });

    it('SALES는 회원가입 버튼이 보이지 않는다', () => {
        localStorage.setItem('token', createJwt('SALES'));
        render(<UserPage />, { wrapper: MemoryRouter });

        expect(screen.queryByText('유저 회원가입')).not.toBeInTheDocument();
        expect(screen.getByText('로그아웃')).toBeInTheDocument();
        expect(screen.getByText('고객사 페이지')).toBeInTheDocument();
    });

    it('회원가입 버튼 클릭 시 /signup으로 이동한다 (ADMIN)', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<UserPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('유저 회원가입'));
        expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    it('고객사 페이지 버튼 클릭 시 /company로 이동한다', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<UserPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('고객사 페이지'));
        expect(mockNavigate).toHaveBeenCalledWith('/company');
    });

    it('내 정보 보기 버튼 클릭 시 /user/me로 이동한다', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<UserPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('내 정보 보기')); // ✅ 추가 테스트
        expect(mockNavigate).toHaveBeenCalledWith('/user/me');
    });

    it('로그아웃 버튼 클릭 시 토큰 삭제 및 / 이동', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<UserPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('로그아웃'));
        expect(localStorage.getItem('token')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
