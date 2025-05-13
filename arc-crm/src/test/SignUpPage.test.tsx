import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '../pages/SignUpPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const fakeJwt = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    btoa(JSON.stringify({ role: 'ADMIN', exp: 9999999999 })),
    'signature',
].join('.');

beforeEach(() => {
    localStorage.setItem('token', fakeJwt);
});

afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

describe('SignUpPage', () => {
    it('필수 입력 필드와 버튼이 렌더링된다', () => {
        render(<SignUpPage />, { wrapper: MemoryRouter });

        expect(screen.getByPlaceholderText('*아이디(3자 이상 20자 이하 영문 or 숫자)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*패스워드(7자 이상 20자 이하 영문 포함 숫자')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('이메일(test@test.com)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*이름')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*전화번호(010-0000-0000)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*직책')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*부서')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('ADMIN 권한으로 회원가입 요청 시 fetch 호출 및 /company 이동', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ message: '회원가입에 성공하였습니다.' }),
            })
        ) as jest.Mock;

        render(<SignUpPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByPlaceholderText('*아이디(3자 이상 20자 이하 영문 or 숫자)'), {
            target: { value: 'newuser' },
        });
        fireEvent.change(screen.getByPlaceholderText('*패스워드(7자 이상 20자 이하 영문 포함 숫자'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByPlaceholderText('이메일(test@test.com)'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('*이름'), { target: { value: '홍길동' } });
        fireEvent.change(screen.getByPlaceholderText('*전화번호(010-0000-0000)'), {
            target: { value: '01012345678' },
        });
        fireEvent.change(screen.getByPlaceholderText('*직책'), { target: { value: '사원' } });
        fireEvent.change(screen.getByPlaceholderText('*부서'), { target: { value: '영업팀' } });
        
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'ADMIN' },
        });

        fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/admin/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${fakeJwt}`,
                },
                body: JSON.stringify({
                    userId: 'newuser',
                    userPassword: 'test1234',
                    userEmail: 'test@abc.com',
                    userName: '홍길동',
                    userPhone: '01012345678',
                    userRole: 'ADMIN',
                    userPosition: '사원',
                    userDivision: '영업팀',
                }),
            });

            expect(mockNavigate).toHaveBeenCalledWith('/company');
        });
    });

    it('회원가입 실패 시 에러 메시지를 표시한다', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ userId: '이미 존재하는 아이디입니다.' }),
            })
        ) as jest.Mock;

        render(<SignUpPage />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByPlaceholderText('*아이디(3자 이상 20자 이하 영문 or 숫자)'), {
            target: { value: 'existinguser' },
        });
        fireEvent.change(screen.getByPlaceholderText('*패스워드(7자 이상 20자 이하 영문 포함 숫자'), {
            target: { value: 'test1234' },
        });
        fireEvent.change(screen.getByPlaceholderText('이메일(test@test.com)'), {
            target: { value: 'test@abc.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('*이름'), { target: { value: '홍길동' } });
        fireEvent.change(screen.getByPlaceholderText('*전화번호(010-0000-0000)'), {
            target: { value: '01012345678' },
        });
        fireEvent.change(screen.getByPlaceholderText('*직책'), { target: { value: '사원' } });
        fireEvent.change(screen.getByPlaceholderText('*부서'), { target: { value: '영업팀' } });

        fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

        await waitFor(() => {
            expect(screen.getByText('이미 존재하는 아이디입니다.')).toBeInTheDocument();
        });
    });
});
