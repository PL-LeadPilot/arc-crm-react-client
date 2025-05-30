import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DealPage from '../pages/DealPage';
import { BrowserRouter } from 'react-router-dom';

beforeEach(() => {
    global.fetch = jest.fn((url, options) => {
        if (typeof url === 'string' && url.includes('/deal?page=')) {
            return Promise.resolve(new Response(JSON.stringify({
                content: [
                    {
                        dealId: 1,
                        dealName: 'Test Deal',
                        companyId: 101,
                        companyUserId: 201,
                        userName: '홍길동',
                        sourceType: 'INBOUND',
                        statusType: 'NEW',
                        dealAt: '2024-01-01',
                    },
                ],
                totalPages: 1,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        if (typeof url === 'string' && url.includes('/deal/dealDetails')) {
            return Promise.resolve(new Response(JSON.stringify({
                dealName: 'Test Deal',
                companyId: 101,
                companyUserId: 201,
                userId: 'user01',
                userName: '홍길동',
                sourceType: 'INBOUND',
                statusType: 'NEW',
                dealAt: '2024-01-01',
                updatedAt: new Date().toISOString(),
            }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        if (typeof url === 'string' && url.includes('/contact/byDeal')) {
            return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return Promise.reject(new Error('Unhandled fetch: ' + url));
    });
});

test('renders search inputs', async () => {
    await act(async () => {
        render(<BrowserRouter><DealPage /></BrowserRouter>);
    });

    expect(screen.getByPlaceholderText('고객사명')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('고객사 사원명')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('영업명')).toBeInTheDocument();
});

test('opens detail panel when deal is clicked', async () => {
    await act(async () => {
        render(<BrowserRouter><DealPage /></BrowserRouter>);
    });

    const dealNameCell = await screen.findByText('Test Deal');
    fireEvent.click(dealNameCell);

    const headers = await screen.findAllByText('영업 상세 정보');
    expect(headers.length).toBeGreaterThan(0);
});

test('opens add form when button clicked', async () => {
    await act(async () => {
        render(<BrowserRouter><DealPage /></BrowserRouter>);
    });

    const button = screen.getByText('영업 이력 등록');
    fireEvent.click(button);

    expect(await screen.findByText('*영업명')).toBeInTheDocument();
});

test('renders and shows deal', async () => {
    await act(async () => {
        render(<BrowserRouter><DealPage /></BrowserRouter>);
    });

    expect(await screen.findByText('Test Deal')).toBeInTheDocument();
});
