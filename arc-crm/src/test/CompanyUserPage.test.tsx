import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CompanyUserPage from '../pages/CompanyUserPage';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('CompanyUserPage', () => {
    const setup = async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'fake-token');

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ content: [], totalPages: 1 }),
        });
    });

    it('renders initial elements', async () => {
        await setup();
        expect(screen.getByPlaceholderText('고객사명')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('사원명')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '검색' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '고객사 사원 등록' })).toBeInTheDocument();
    });

    it('displays loading indicator while fetching users', async () => {
        // fetch 지연시켜서 로딩 상태 유지
        global.fetch = jest.fn().mockImplementation(() =>
            new Promise((resolve) =>
                setTimeout(() =>
                    resolve({
                        ok: true,
                        json: async () => ({ content: [], totalPages: 1 }),
                    }), 200)
            )
        );

        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });

        // "로딩 중..." 텍스트가 포함된 엘리먼트를 찾음
        await waitFor(() => {
            expect(screen.getByText((text) => text.includes('로딩 중'))).toBeInTheDocument();
        });
    });

    it('opens registration form', async () => {
        await setup();
        fireEvent.click(screen.getByRole('button', { name: '고객사 사원 등록' }));
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: '고객사 사원 등록' })).toBeInTheDocument();
        });
    });

    it('shows validation errors when form is empty', async () => {
        await setup();
        fireEvent.click(screen.getByRole('button', { name: '고객사 사원 등록' }));
        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: '등록' }));
        });

        await waitFor(() => {
            expect(screen.getByText('고객사 ID 필수')).toBeInTheDocument();
            expect(screen.getByText('고객사 사원 이름 필수')).toBeInTheDocument();
            expect(screen.getByText('이메일 필수')).toBeInTheDocument();
            expect(screen.getByText('전화번호 형식: 010-0000-0000')).toBeInTheDocument();
        });
    });
});
