import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '../pages/SignUpPage';

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

describe('SignUpPage', () => {
    it('필수 입력 필드와 버튼이 렌더링된다', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<SignUpPage />, { wrapper: MemoryRouter });

        expect(screen.getByLabelText('*아이디')).toBeInTheDocument();
        expect(screen.getByLabelText('*비밀번호')).toBeInTheDocument();
        expect(screen.getByLabelText('*이메일')).toBeInTheDocument();
        expect(screen.getByLabelText('*이름')).toBeInTheDocument();
        expect(screen.getByLabelText('*전화번호')).toBeInTheDocument();
        expect(screen.getByLabelText('*직책')).toBeInTheDocument();
        expect(screen.getByLabelText('*부서')).toBeInTheDocument();
        expect(screen.getByLabelText('*권한:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('ADMIN 권한으로 회원가입 요청 시 fetch 호출 및 /company 이동', async () => {
        const jwt = createJwt('ADMIN');
        localStorage.setItem('token', jwt);

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ message: '회원가입에 성공하였습니다.' }),
            })
        ) as jest.Mock;

        render(<SignUpPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('*아이디'), {
            target: { value: 'newuser' },
        });
        fireEvent.change(screen.getByLabelText('*비밀번호'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByLabelText('*이메일'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByLabelText('*이름'), {
            target: { value: '홍길동' },
        });
        fireEvent.change(screen.getByLabelText('*전화번호'), {
            target: { value: '010-1234-5678' },
        });
        fireEvent.change(screen.getByLabelText('*직책'), {
            target: { value: '사원' },
        });
        fireEvent.change(screen.getByLabelText('*부서'), {
            target: { value: '영업팀' },
        });
        fireEvent.change(screen.getByLabelText('*권한:'), {
            target: { value: 'ADMIN' },
        });

        fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/admin/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    userId: 'newuser',
                    userPassword: 'test1234',
                    userEmail: 'test@abc.com',
                    userName: '홍길동',
                    userPhone: '010-1234-5678',
                    userRole: 'ADMIN',
                    userPosition: '사원',
                    userDivision: '영업팀',
                }),
            });

            expect(mockNavigate).toHaveBeenCalledWith('/company');
        });
    });

    it('회원가입 실패 시 에러 메시지를 표시한다', async () => {
        localStorage.setItem('token', createJwt('ADMIN'));

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ userId: '이미 존재하는 아이디입니다.' }),
            })
        ) as jest.Mock;

        render(<SignUpPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByLabelText('*아이디'), {
            target: { value: 'existinguser' },
        });
        fireEvent.change(screen.getByLabelText('*비밀번호'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByLabelText('*이메일'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByLabelText('*이름'), {
            target: { value: '홍길동' },
        });
        fireEvent.change(screen.getByLabelText('*전화번호'), {
            target: { value: '010-1234-5678' },
        });
        fireEvent.change(screen.getByLabelText('*직책'), {
            target: { value: '사원' },
        });
        fireEvent.change(screen.getByLabelText('*부서'), {
            target: { value: '영업팀' },
        });

        fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

        await waitFor(() => {
            expect(screen.getByText('이미 존재하는 아이디입니다.')).toBeInTheDocument();
        });
    });
});
