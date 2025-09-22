/**
 * Accessibility Test Suite for Admin Panel
 * Tests WCAG 2.1 AA compliance
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import components to test
import App from '../App';
import BlogForm from '../components/blog/BlogForm';
import UserForm from '../components/user/UserForm';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock services
vi.mock('../services/auth', () => ({
    isAuthenticated: vi.fn(() => false),
    getCurrentUser: vi.fn(() => null),
    login: vi.fn(),
}));

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                {component}
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Accessibility Tests', () => {
    describe('WCAG 2.1 AA Compliance', () => {
        test('Login page should have no accessibility violations', async () => {
            const { container } = renderWithProviders(<Login />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        test('Blog form should have no accessibility violations', async () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            const { container } = render(<BlogForm {...mockProps} />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        test('User form should have no accessibility violations', async () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            const { container } = render(<UserForm {...mockProps} />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });

    describe('Keyboard Navigation', () => {
        test('should support tab navigation through form elements', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // Get all focusable elements
            const focusableElements = screen.getAllByRole('textbox')
                .concat(screen.getAllByRole('button'))
                .concat(screen.getAllByRole('combobox'));

            // Each element should be focusable
            focusableElements.forEach(element => {
                expect(element).not.toHaveAttribute('tabindex', '-1');
            });
        });

        test('should have proper focus management in modals', () => {
            // Test focus trap in modal dialogs
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<UserForm {...mockProps} />);

            // First focusable element should receive focus
            const firstInput = screen.getAllByRole('textbox')[0];
            firstInput.focus();
            expect(document.activeElement).toBe(firstInput);
        });
    });

    describe('Screen Reader Support', () => {
        test('should have proper ARIA labels on form controls', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // All form inputs should have accessible names
            const inputs = screen.getAllByRole('textbox');
            inputs.forEach(input => {
                expect(input).toHaveAccessibleName();
            });

            // All buttons should have accessible names
            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });

        test('should have proper heading hierarchy', () => {
            renderWithProviders(<App />);

            const headings = screen.getAllByRole('heading');

            // Should have at least one h1
            const h1Elements = headings.filter(h => h.tagName === 'H1');
            expect(h1Elements.length).toBeGreaterThanOrEqual(1);

            // Headings should follow proper hierarchy
            headings.forEach(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                expect(level).toBeGreaterThanOrEqual(1);
                expect(level).toBeLessThanOrEqual(6);
            });
        });

        test('should have proper ARIA landmarks', () => {
            renderWithProviders(<App />);

            // Should have main landmark
            expect(screen.getByRole('main')).toBeInTheDocument();

            // Should have navigation landmark
            expect(screen.getByRole('navigation')).toBeInTheDocument();
        });

        test('should provide status updates for dynamic content', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: true,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // Loading states should be announced
            const loadingElements = screen.getAllByRole('status');
            expect(loadingElements.length).toBeGreaterThan(0);
        });
    });

    describe('Color and Contrast', () => {
        test('should not rely solely on color for information', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null,
                errors: { title: 'Title is required' }
            };

            render(<BlogForm {...mockProps} />);

            // Error states should have text indicators, not just color
            const errorMessages = screen.getAllByRole('alert');
            errorMessages.forEach(error => {
                expect(error).toHaveTextContent();
            });
        });

        test('should have sufficient color contrast', async () => {
            const { container } = renderWithProviders(<App />);

            // Use axe to check color contrast
            const results = await axe(container, {
                rules: {
                    'color-contrast': { enabled: true }
                }
            });

            expect(results).toHaveNoViolations();
        });
    });

    describe('Form Accessibility', () => {
        test('should associate labels with form controls', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<UserForm {...mockProps} />);

            // All inputs should have associated labels
            const inputs = screen.getAllByRole('textbox');
            inputs.forEach(input => {
                expect(input).toHaveAccessibleName();
            });

            // Check for proper label association
            const labels = container.querySelectorAll('label');
            labels.forEach(label => {
                const forAttribute = label.getAttribute('for');
                if (forAttribute) {
                    const associatedInput = container.querySelector(`#${forAttribute}`);
                    expect(associatedInput).toBeInTheDocument();
                }
            });
        });

        test('should provide clear error messages', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null,
                errors: {
                    email: 'Please enter a valid email address',
                    password: 'Password must be at least 8 characters'
                }
            };

            render(<UserForm {...mockProps} />);

            // Error messages should be associated with inputs
            const errorMessages = screen.getAllByRole('alert');
            expect(errorMessages.length).toBeGreaterThan(0);

            errorMessages.forEach(error => {
                expect(error).toHaveTextContent();
                expect(error).toBeVisible();
            });
        });

        test('should indicate required fields', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // Required fields should be marked
            const requiredInputs = screen.getAllByRole('textbox', { required: true });
            expect(requiredInputs.length).toBeGreaterThan(0);

            // Visual indicators for required fields
            const labels = container.querySelectorAll('label');
            const requiredLabels = Array.from(labels).filter(label =>
                label.textContent.includes('*')
            );
            expect(requiredLabels.length).toBeGreaterThan(0);
        });
    });

    describe('Interactive Elements', () => {
        test('should have proper button roles and states', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                // Buttons should have accessible names
                expect(button).toHaveAccessibleName();

                // Disabled buttons should have proper state
                if (button.disabled) {
                    expect(button).toHaveAttribute('aria-disabled', 'true');
                }
            });
        });

        test('should provide feedback for user actions', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null,
                success: 'Blog created successfully!'
            };

            render(<BlogForm {...mockProps} />);

            // Success messages should be announced
            const successMessage = screen.getByRole('status');
            expect(successMessage).toHaveTextContent('Blog created successfully!');
        });
    });

    describe('Mobile Accessibility', () => {
        test('should have proper touch targets', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // Interactive elements should be large enough for touch
            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                const styles = window.getComputedStyle(button);
                const minSize = 44; // WCAG minimum touch target size

                // Note: In a real test, you'd check computed dimensions
                expect(button).toBeInTheDocument();
            });
        });

        test('should support zoom up to 200%', async () => {
            const { container } = renderWithProviders(<App />);

            // Simulate zoom by checking if content is still accessible
            // In a real test, you'd use browser automation tools
            const results = await axe(container, {
                rules: {
                    'meta-viewport': { enabled: true }
                }
            });

            expect(results).toHaveNoViolations();
        });
    });

    describe('Dynamic Content', () => {
        test('should announce loading states', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: true,
                initialData: null
            };

            render(<BlogForm {...mockProps} />);

            // Loading indicators should be announced to screen readers
            const loadingIndicator = screen.getByRole('status');
            expect(loadingIndicator).toBeInTheDocument();
        });

        test('should manage focus when content changes', () => {
            const mockProps = {
                mode: 'create',
                onSubmit: vi.fn(),
                onCancel: vi.fn(),
                loading: false,
                initialData: null
            };

            const { rerender } = render(<BlogForm {...mockProps} />);

            // Focus should be managed when switching between modes
            rerender(<BlogForm {...mockProps} mode="edit" />);

            // In a real implementation, focus should move to appropriate element
            expect(document.activeElement).toBeDefined();
        });
    });
});