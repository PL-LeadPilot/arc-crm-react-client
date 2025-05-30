import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactHistoryPage from '../pages/ContactHistoryPage';
import { BrowserRouter } from 'react-router-dom';

describe('ContactHistoryPage', () => {
    const renderComponent = () => {
        render(
            <BrowserRouter>
                <ContactHistoryPage />
            </BrowserRouter>
        );
    };

    test('renders page title and navbar', () => {
        renderComponent();
        expect(screen.getByText('컨택 이력 등록')).toBeInTheDocument();
        expect(screen.getByText('검색')).toBeInTheDocument();
    });

    test('renders search input fields', () => {
        renderComponent();
        expect(screen.getByPlaceholderText('고객사명')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('고객사 사원명')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('담당자명')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('영업명')).toBeInTheDocument();
    });

    test('clicking 등록 shows form modal', () => {
        renderComponent();
        const buttons = screen.getAllByText('컨택 이력 등록');
        fireEvent.click(buttons[0]); // 등록 버튼 클릭

        // 중복 방지: 두 번째 "컨택 이력 등록"은 모달의 제목
        const modalTitle = screen.getAllByText('컨택 이력 등록')[1];
        expect(modalTitle).toBeInTheDocument();

        expect(screen.getByText('등록')).toBeInTheDocument();
    });

    test('clicking 취소 in 등록 form hides the form', async () => {
        renderComponent();
        fireEvent.click(screen.getByText('컨택 이력 등록'));
        const cancelButton = screen.getByText('취소');
        fireEvent.click(cancelButton);
        await waitFor(() => {
            expect(screen.queryByRole('heading', { name: '컨택 이력 등록' })).not.toBeInTheDocument();
        });
    });

    test('shows loading message initially', async () => {
        renderComponent();
        expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
});
