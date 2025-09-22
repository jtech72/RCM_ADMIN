import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Test admin error');
    }
    return <div>Admin panel working</div>;
};

// Mock fetch for error logging
global.fetch = vi.fn();

describe('Admin ErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Admin panel working')).toBeInTheDocument();
    });

    test('renders admin-specific error UI when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Admin Panel Error')).toBeInTheDocument();
        expect(screen.getByText(/An error occurred in the admin panel/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    });

    test('logs error with admin context in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(fetch).toHaveBeenCalledWith('/api/logs/client-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: expect.stringContaining('"context":"admin-panel"')
        });

        process.env.NODE_ENV = originalEnv;
    });

    test('handles dashboard navigation button click', () => {
        // Mock window.location
        delete window.location;
        window.location = { href: '' };

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));

        expect(window.location.href).toBe('/admin/dashboard');
    });

    test('shows error details in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });
});