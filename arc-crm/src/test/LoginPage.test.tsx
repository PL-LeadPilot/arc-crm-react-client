import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

beforeEach(() => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'fake-token' }),
        })
    ) as jest.Mock;
});

afterEach(() => {
    jest.clearAllMocks();
});

test('admin/admin1234로 로그인 fetch 요청', async () => {
    render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('아이디'), {
        target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('패스워드'), {
        target: { value: 'admin1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'admin', userPassword: 'admin1234' }),
        });
    });
});