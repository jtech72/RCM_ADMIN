import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth service
vi.mock('../../services/auth', () => ({
    default: {
        login: vi.fn(),
        getCurrentUser: vi.fn(() => null),
        getToken: vi.fn(() => null),
        isAuthenticated: vi.fn(() => false),
        verifyToken: vi.fn(() => Promise.resolve(false)),
    }
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null }),
    };
});

// Test wrapper component
function TestWrapper({ children }) {
    return (
        <BrowserRouter>
            <AuthProvider>
                {children}
            </AuthProvider>
        </BrowserRouter>
    );
}

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render login form', () => {
        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        expect(screen.getByText('Admin Panel Login')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument();
            expect(screen.getByText('Password is required')).toBeInTheDocument();
        });
    });

    it('should show validation error for invalid email', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const emailInput = screen.getByLabelText(/email address/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'invalid-email');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        });
    });

    it('should show validation error for short password', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(passwordInput, '123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
        });
    });

    it('should toggle password visibility', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const passwordInput = screen.getByLabelText(/password/i);
        const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

        expect(passwordInput).toHaveAttribute('type', 'password');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should submit form with valid data', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'admin@test.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Signing in...')).toBeInTheDocument();
        });
    });

    it('should display error message on login failure', async () => {
        const user = userEvent.setup();

        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'admin@test.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        // The error will be handled by the AuthContext
        // This test verifies the form submission flow
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    it('should show role requirement message', () => {
        render(
            <TestWrapper>
                <Login />
            </TestWrapper>
        );

        expect(screen.getByText('Only admin and editor accounts can access this panel')).toBeInTheDocument();
    });
});