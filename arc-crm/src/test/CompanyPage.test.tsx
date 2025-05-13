import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CompanyPage from '../pages/CompanyPage';

// navigate 모킹
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe('CompanyPage', () => {
    it('유저, 로그아웃 버튼 및 텍스트가 렌더링된다', () => {
        render(<CompanyPage />, { wrapper: MemoryRouter });

        expect(screen.getByText('유저')).toBeInTheDocument();
        expect(screen.getByText('로그아웃')).toBeInTheDocument();
        expect(screen.getByText('Company Page')).toBeInTheDocument();
        expect(screen.getByText('여기에 고객사 리스트나 기능이 들어갑니다.')).toBeInTheDocument();
    });

    it('로그아웃 버튼 클릭 시 토큰 제거 및 /로 이동한다', () => {
        localStorage.setItem('token', 'fake-token');
        render(<CompanyPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('로그아웃'));

        expect(localStorage.getItem('token')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('유저 버튼 클릭 시 /user로 이동한다', () => {
        render(<CompanyPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByText('유저'));

        expect(mockNavigate).toHaveBeenCalledWith('/user');
    });
});
