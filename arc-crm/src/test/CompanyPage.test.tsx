import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyPage from '../pages/CompanyPage';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: [], totalPages: 1 }),
    })
) as jest.Mock;

describe('CompanyPage', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    test('renders navigation and search input', async () => {
        render(
            <BrowserRouter>
                <CompanyPage />
            </BrowserRouter>
        );

        expect(screen.getByText('로그아웃')).toBeInTheDocument();
        expect(screen.getByText('유저 페이지')).toBeInTheDocument();
        expect(screen.getByText('고객사 페이지')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('고객사명')).toBeInTheDocument();
        await waitFor(() => expect(fetch).toHaveBeenCalled());
    });

    test('can type in search input and click search', async () => {
        render(
            <BrowserRouter>
                <CompanyPage />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText('고객사명') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '테스트고객사' } });
        expect(input.value).toBe('테스트고객사');

        const button = screen.getByText('검색');
        fireEvent.click(button);

        await waitFor(() => expect(fetch).toHaveBeenCalled());
    });

    test('displays loading and then table', async () => {
        render(
            <BrowserRouter>
                <CompanyPage />
            </BrowserRouter>
        );

        expect(screen.getByText('로딩 중...')).toBeInTheDocument();
        await waitFor(() => expect(fetch).toHaveBeenCalled());
    });

    test('displays error if fetch fails', async () => {
        (fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({ ok: false })
        );

        render(
            <BrowserRouter>
                <CompanyPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('고객사 정보를 불러오는데 실패했습니다.')).toBeInTheDocument();
        });
    });
});
