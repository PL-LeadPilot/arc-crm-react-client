import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '../../pages/user-pages/SignUpPage';

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

describe('SignUpPage (no id)', () => {
    it('필수 입력 필드와 버튼이 렌더링된다', () => {
        localStorage.setItem('token', createJwt('ADMIN'));
        render(<SignUpPage />, { wrapper: MemoryRouter });

        expect(screen.getByPlaceholderText('3~20자 (영문 or 숫자)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('7~20자 (영문 + 숫자)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('exam@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('2~20자 문자')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*010-0000-0000')).toBeInTheDocument();
        const [positionInput, divisionInput] = screen.getAllByPlaceholderText('최대 30자'); // 부서
        expect(screen.getByRole('combobox')).toBeInTheDocument(); // 권한 선택
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

        fireEvent.change(screen.getByPlaceholderText('3~20자 (영문 or 숫자)'), {
            target: { value: 'newuser' },
        });
        fireEvent.change(screen.getByPlaceholderText('7~20자 (영문 + 숫자)'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByPlaceholderText('exam@example.com'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('2~20자 문자'), {
            target: { value: '홍길동' },
        });
        fireEvent.change(screen.getByPlaceholderText('*010-0000-0000'), {
            target: { value: '010-1234-5678' },
        });
        const [positionInput, divisionInput] = screen.getAllByPlaceholderText('최대 30자');
        fireEvent.change(positionInput, { target: { value: '사원' } }); // userPosition
        fireEvent.change(divisionInput, { target: { value: '영업팀' } }); // userDivision

        fireEvent.change(screen.getByRole('combobox'), {
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

        fireEvent.change(screen.getByPlaceholderText('3~20자 (영문 or 숫자)'), {
            target: { value: 'existinguser' },
        });
        fireEvent.change(screen.getByPlaceholderText('7~20자 (영문 + 숫자)'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByPlaceholderText('exam@example.com'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('2~20자 문자'), {
            target: { value: '홍길동' },
        });
        fireEvent.change(screen.getByPlaceholderText('*010-0000-0000'), {
            target: { value: '010-1234-5678' },
        });
        fireEvent.change(screen.getAllByPlaceholderText('최대 30자')[0], {
            target: { value: '사원' },
        });
        fireEvent.change(screen.getAllByPlaceholderText('최대 30자')[1], {
            target: { value: '영업팀' },
        });

        fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

        await waitFor(() => {
            expect(screen.getByText('이미 존재하는 아이디입니다.')).toBeInTheDocument();
        });
    });
});
