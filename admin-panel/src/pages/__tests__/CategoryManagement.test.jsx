import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryManagement from '../CategoryManagement.jsx';
import categoryService from '../../services/category.js';

// Mock the category service
vi.mock('../../services/category.js', () => ({
    default: {
        getCategories: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn()
    }
}));

describe('CategoryManagement', () => {
    const mockCategories = [
        {
            _id: '1',
            name: 'Technology',
            slug: 'technology',
            description: 'Tech related posts',
            color: '#6366f1',
            isActive: true,
            blogCount: 5,
            createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
            _id: '2',
            name: 'Business',
            slug: 'business',
            description: 'Business related posts',
            color: '#10b981',
            isActive: true,
            blogCount: 3,
            createdAt: '2023-01-02T00:00:00.000Z'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        categoryService.getCategories.mockResolvedValue({
            success: true,
            data: mockCategories
        });
    });

    describe('Initial Render', () => {
        it('renders category management page', async () => {
            render(<CategoryManagement />);

            expect(screen.getByText('Category Management')).toBeInTheDocument();
            expect(screen.getByText('Manage blog categories and their settings')).toBeInTheDocument();
            expect(screen.getByText('Add Category')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('Technology')).toBeInTheDocument();
                expect(screen.getByText('Business')).toBeInTheDocument();
            });
        });

        it('displays categories in table format', async () => {
            render(<CategoryManagement />);

            await waitFor(() => {
                expect(screen.getByText('Technology')).toBeInTheDocument();
                expect(screen.getByText('Tech related posts')).toBeInTheDocument();
                expect(screen.getByText('Business')).toBeInTheDocument();
                expect(screen.getByText('Business related posts')).toBeInTheDocument();
            });
        });
    });

    describe('Add Category', () => {
        it('shows add category form when button is clicked', async () => {
            const user = userEvent.setup();
            render(<CategoryManagement />);

            const addButton = screen.getByText('Add Category');
            await user.click(addButton);

            expect(screen.getByText('Add New Category')).toBeInTheDocument();
            expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        });

        it('creates new category when form is submitted', async () => {
            const user = userEvent.setup();
            categoryService.createCategory.mockResolvedValue({
                success: true,
                data: { _id: '3', name: 'Health', slug: 'health' }
            });

            render(<CategoryManagement />);

            // Open form
            const addButton = screen.getByText('Add Category');
            await user.click(addButton);

            // Fill form
            const nameInput = screen.getByLabelText(/name \*/i);
            await user.type(nameInput, 'Health');

            const descriptionInput = screen.getByLabelText(/description/i);
            await user.type(descriptionInput, 'Health related posts');

            // Submit form
            const createButton = screen.getByText('Create');
            await user.click(createButton);

            expect(categoryService.createCategory).toHaveBeenCalledWith({
                name: 'Health',
                description: 'Health related posts',
                color: '#6366f1',
                icon: ''
            });
        });
    });

    describe('Edit Category', () => {
        it('opens edit form when edit button is clicked', async () => {
            const user = userEvent.setup();
            render(<CategoryManagement />);

            await waitFor(() => {
                expect(screen.getByText('Technology')).toBeInTheDocument();
            });

            const editButtons = screen.getAllByRole('button');
            const editButton = editButtons.find(button => 
                button.querySelector('svg') && button.getAttribute('class')?.includes('text-blue-600')
            );
            
            if (editButton) {
                await user.click(editButton);
                expect(screen.getByText('Edit Category')).toBeInTheDocument();
            }
        });
    });

    describe('Error Handling', () => {
        it('displays error message when category fetch fails', async () => {
            categoryService.getCategories.mockResolvedValue({
                success: false,
                error: 'Failed to fetch categories'
            });

            render(<CategoryManagement />);

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch categories')).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading spinner initially', () => {
            render(<CategoryManagement />);
            
            expect(screen.getByRole('generic')).toHaveClass('animate-spin');
        });
    });
});