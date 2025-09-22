import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker.jsx';

describe('DateRangePicker Component', () => {
    const mockProps = {
        startDate: '',
        endDate: '',
        onStartDateChange: vi.fn(),
        onEndDateChange: vi.fn(),
        onClear: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render date range picker with labels', () => {
        render(<DateRangePicker {...mockProps} />);

        expect(screen.getByText('Date Range:')).toBeInTheDocument();
        expect(screen.getByText('From:')).toBeInTheDocument();
        expect(screen.getByText('To:')).toBeInTheDocument();
        expect(screen.getByLabelText('From:')).toBeInTheDocument();
        expect(screen.getByLabelText('To:')).toBeInTheDocument();
    });

    it('should display formatted dates when provided', () => {
        const propsWithDates = {
            ...mockProps,
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-12-31T23:59:59.999Z'
        };

        render(<DateRangePicker {...propsWithDates} />);

        const startDateInput = screen.getByLabelText('From:');
        const endDateInput = screen.getByLabelText('To:');

        expect(startDateInput.value).toBe('2023-01-01');
        expect(endDateInput.value).toBe('2023-12-31');
    });

    it('should show clear button when dates are provided', () => {
        const propsWithDates = {
            ...mockProps,
            startDate: '2023-01-01T00:00:00.000Z'
        };

        render(<DateRangePicker {...propsWithDates} />);

        expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should not show clear button when no dates are provided', () => {
        render(<DateRangePicker {...mockProps} />);

        expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('should call onStartDateChange when start date is changed', () => {
        render(<DateRangePicker {...mockProps} />);

        const startDateInput = screen.getByLabelText('From:');
        fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });

        expect(mockProps.onStartDateChange).toHaveBeenCalledWith('2023-01-01T00:00:00.000Z');
    });

    it('should call onEndDateChange when end date is changed', () => {
        render(<DateRangePicker {...mockProps} />);

        const endDateInput = screen.getByLabelText('To:');
        fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });

        expect(mockProps.onEndDateChange).toHaveBeenCalledWith('2023-12-31T00:00:00.000Z');
    });

    it('should call onClear when clear button is clicked', () => {
        const propsWithDates = {
            ...mockProps,
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-12-31T23:59:59.999Z'
        };

        render(<DateRangePicker {...propsWithDates} />);

        const clearButton = screen.getByText('Clear');
        fireEvent.click(clearButton);

        expect(mockProps.onClear).toHaveBeenCalled();
    });

    it('should show date range summary when both dates are provided', () => {
        const propsWithDates = {
            ...mockProps,
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-12-31T23:59:59.999Z'
        };

        render(<DateRangePicker {...propsWithDates} />);

        expect(screen.getByText(/Showing data from/)).toBeInTheDocument();
        expect(screen.getByText(/1\/1\/2023 to 12\/31\/2023/)).toBeInTheDocument();
    });

    it('should handle empty date input', () => {
        render(<DateRangePicker {...mockProps} />);

        const startDateInput = screen.getByLabelText('From:');
        fireEvent.change(startDateInput, { target: { value: '' } });

        expect(mockProps.onStartDateChange).toHaveBeenCalledWith('');
    });

    it('should format date correctly for input field', () => {
        const propsWithDate = {
            ...mockProps,
            startDate: '2023-06-15T14:30:00.000Z'
        };

        render(<DateRangePicker {...propsWithDate} />);

        const startDateInput = screen.getByLabelText('From:');
        expect(startDateInput.value).toBe('2023-06-15');
    });

    it('should handle invalid date gracefully', () => {
        const propsWithInvalidDate = {
            ...mockProps,
            startDate: 'invalid-date'
        };

        render(<DateRangePicker {...propsWithInvalidDate} />);

        const startDateInput = screen.getByLabelText('From:');
        expect(startDateInput.value).toBe('');
    });
});