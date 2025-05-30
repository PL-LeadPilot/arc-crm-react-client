import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import EditMyInfoPage from '../../pages/user-pages/EditMyInfoPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('EditMyInfoPage', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'fake-token');
        global.fetch = jest.fn((url, options) => {
            if (url === '/user/myInfo') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            userName: '홍길동',
                            userPhone: '010-1234-5678',
                            userEmail: 'hong@test.com',
                            userPosition: '대리',
                            userDivision: '기술팀',
                        }),
                });
            }
            if (url === '/user' && options?.method === 'PUT') {
                return Promise.resolve({ ok: true });
            }
            return Promise.reject(new Error('Unknown API call'));
        }) as jest.Mock;
    });

    afterEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('내 정보가 로딩되어 입력 필드에 채워진다', async () => {
        render(<EditMyInfoPage />, { wrapper: MemoryRouter });

        expect(await screen.findByDisplayValue('홍길동')).toBeInTheDocument();
        expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();
        expect(screen.getByDisplayValue('hong@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('대리')).toBeInTheDocument();
        expect(screen.getByDisplayValue('기술팀')).toBeInTheDocument();
    });

    it('유효한 값 입력 후 수정 요청 시 /user/me로 이동', async () => {
        render(<EditMyInfoPage />, { wrapper: MemoryRouter });

        fireEvent.change(await screen.findByLabelText('*현재 비밀번호'), {
            target: { value: 'currentPass123' },
        });
        fireEvent.change(screen.getByLabelText('새 비밀번호 (선택)'), {
            target: { value: 'newPass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: '저장' }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/user/me');
        });
    });

    it('현재 비밀번호 없이 제출 시 에러 메시지 표시', async () => {
        render(<EditMyInfoPage />, { wrapper: MemoryRouter });
        fireEvent.click(await screen.findByRole('button', { name: '저장' }));

        await waitFor(() => {
            expect(screen.getByText('현재 비밀번호는 필수입니다.')).toBeInTheDocument();
        });
    });

    it('전화번호 유효성 오류 발생 시 메시지 출력', async () => {
        render(<EditMyInfoPage />, { wrapper: MemoryRouter });
        await screen.findByDisplayValue('010-1234-5678');

        fireEvent.change(screen.getByLabelText('전화번호'), {
            target: { value: '1234' },
        });
        fireEvent.change(screen.getByLabelText('*현재 비밀번호'), {
            target: { value: 'pass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: '저장' }));

        await waitFor(() => {
            expect(screen.getByText('전화번호 형식은 010-0000-0000입니다.')).toBeInTheDocument();
        });
    });
});
