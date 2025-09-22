import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Navigate: ({ to, state }) => <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)} />,
    };
});

// Test wrapper component
function TestWrapper({ children }) {
    return (
        <BrowserRouter>
            {children}
        </BrowserRouter>
    );
}

// Test component to render inside ProtectedRoute
function TestComponent() {
    return <div data-testid="protected-content">Protected Content</div>;
}

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show loading spinner when authentication is loading', () => {
        useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
            isAdmin: () => false,
            canEdit: () => false,
        });

        render(
            <TestWrapper>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', () => {
        useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            isAdmin: () => false,
            canEdit: () => false,
        });

        render(
            <TestWrapper>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        const navigate = screen.getByTestId('navigate');
        expect(navigate).toHaveAttribute('data-to', '/login');
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render protected content when authenticated and can edit', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            isAdmin: () => false,
            canEdit: () => true,
        });

        render(
            <TestWrapper>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('should show access denied when authenticated but cannot edit', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            isAdmin: () => false,
            canEdit: () => false,
        });

        render(
            <TestWrapper>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You need editor or admin privileges to access this page.')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render protected content when user is admin', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            isAdmin: () => true,
            canEdit: () => true,
        });

        render(
            <TestWrapper>
                <ProtectedRoute requireAdmin={true}>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should show access denied when requireAdmin is true but user is not admin', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            isAdmin: () => false,
            canEdit: () => true,
        });

        render(
            <TestWrapper>
                <ProtectedRoute requireAdmin={true}>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You need admin privileges to access this page.')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render protected content for editor when requireAdmin is false', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            isAdmin: () => false,
            canEdit: () => true,
        });

        render(
            <TestWrapper>
                <ProtectedRoute requireAdmin={false}>
                    <TestComponent />
                </ProtectedRoute>
            </TestWrapper>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
});