import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import MyInfoPage from '../../pages/user-pages/MyInfoPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

beforeEach(() => {
    localStorage.setItem('token', 'fake-token');

    global.fetch = jest.fn((url) => {
        if (url === '/user/myInfo') {
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        userName: '홍길동',
                        userPhone: '010-1234-5678',
                        userEmail: 'hong@test.com',
                        userPosition: '사원',
                        userDivision: '영업부',
                        updatedAt: '2024-05-01',
                    }),
            });
        }

        if (url === '/user') {
            return Promise.resolve({ ok: true });
        }

        return Promise.reject(new Error('unknown API call'));
    }) as jest.Mock;
});

afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe('MyInfoPage', () => {
    test('내 정보가 정상적으로 렌더링된다', async () => {
        render(<MyInfoPage />, { wrapper: MemoryRouter });

        expect(await screen.findByText('홍길동')).toBeInTheDocument();
        expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
        expect(screen.getByText('hong@test.com')).toBeInTheDocument();
        expect(screen.getByText('사원')).toBeInTheDocument();
        expect(screen.getByText('영업부')).toBeInTheDocument();
        expect(screen.getByText('2024-05-01')).toBeInTheDocument();
    });

    test('수정 버튼 클릭 시 /user/me/edit으로 이동한다', async () => {
        render(<MyInfoPage />, { wrapper: MemoryRouter });

        const button = await screen.findByRole('button', { name: '수정' });
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith('/user/me/edit');
    });

    test('탈퇴 시 confirm, prompt, fetch 요청 후 navigate 호출', async () => {
        window.confirm = jest.fn(() => true);
        window.prompt = jest.fn(() => 'password123');
        window.alert = jest.fn();

        render(<MyInfoPage />, { wrapper: MemoryRouter });

        const 탈퇴 = await screen.findByText('탈퇴');
        fireEvent.click(탈퇴);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/user', expect.objectContaining({ method: 'DELETE' }));
            expect(localStorage.getItem('token')).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('/');
            expect(window.alert).toHaveBeenCalledWith('탈퇴 성공');
        });
    });

    test('탈퇴 실패 시 alert 호출됨', async () => {
        // 기본 응답: /user/myInfo 성공
        (global.fetch as jest.Mock).mockImplementation((url) => {
            if (url === '/user/myInfo') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            userName: '홍길동',
                            userPhone: '010-1234-5678',
                            userEmail: 'hong@test.com',
                            userPosition: '사원',
                            userDivision: '영업부',
                            updatedAt: '2024-05-01',
                        }),
                });
            }

            if (url === '/user') {
                return Promise.resolve({ ok: false }); // DELETE 실패 응답
            }

            return Promise.reject(new Error('Unknown API call'));
        });

        window.confirm = jest.fn(() => true);
        window.prompt = jest.fn(() => 'wrong-password');
        window.alert = jest.fn();

        render(<MyInfoPage />, { wrapper: MemoryRouter });

        fireEvent.click(await screen.findByText('탈퇴'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("response.json is not a function");
        });
    });
});
