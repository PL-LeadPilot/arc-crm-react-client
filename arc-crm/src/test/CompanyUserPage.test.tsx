import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyUserPage from '../pages/CompanyUserPage';
import { BrowserRouter } from 'react-router-dom';

const mockUserData = {
    content: [
        {
            companyUserId: 1,
            companyId: 1,
            companyName: '테스트 기업',
            companyUserName: '홍길동',
            companyUserPhone: '010-1234-5678',
            companyUserEmail: 'test@example.com',
            companyUserPosition: '대리',
            companyUserDivision: '영업',
        },
    ],
    totalPages: 1,
};

const mockDealData = [
    {
        dealId: 1,
        dealName: '테스트 영업',
        companyUserId: 1,
        userName: '담당자A',
        source: '온라인',
        status: '진행중',
        dealAt: new Date().toISOString(),
    },
];

beforeAll(() => {
    global.fetch = jest.fn((url) => {
        if (typeof url === 'string') {
            if (url.includes('/deal/byCompany')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockDealData),
                });
            }
            if (url.includes('/companyUser/companyUserDetails')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ updatedAt: new Date().toISOString() }),
                });
            }
            if (url.includes('/companyUser')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockUserData),
                });
            }
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;
});

describe('CompanyUserPage', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    test('renders navigation and search input', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('로그아웃')).toBeInTheDocument();
        expect(screen.getByText('유저 페이지')).toBeInTheDocument();
        expect(screen.getByText('고객사 페이지')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('고객사명 검색')).toBeInTheDocument();
    });

    test('renders the search fields and add form', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByPlaceholderText('사원명 검색')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*고객사 ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*고객사 사원 이름')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('*고객사 사원 이메일')).toBeInTheDocument();
    });

    test('shows error when required fields are empty on add', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });

        const addButton = screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'button' && content === '고객사 사원 추가';
        });
        await act(async () => {
            fireEvent.click(addButton);
        });

        expect(screen.getByText('고객사 ID는 필수입니다.')).toBeInTheDocument();
    });

    test('renders table headers after data load', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <CompanyUserPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('고객사 사원 ID')).toBeInTheDocument();
        expect(screen.getByText('이름')).toBeInTheDocument();
        expect(screen.getByText('고객사명')).toBeInTheDocument();
        expect(screen.getByText('전화번호')).toBeInTheDocument();
        expect(screen.getByText('이메일')).toBeInTheDocument();
        expect(screen.getByText('직급')).toBeInTheDocument();
        expect(screen.getByText('부서')).toBeInTheDocument();
    });
});
