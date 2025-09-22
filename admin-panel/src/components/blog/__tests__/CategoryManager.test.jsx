import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryManager from '../CategoryManager.jsx';
import categoryService from '../../../services/category.js';

// Mock the category service
vi.mock('../../../services/category.js', () => ({
    default: {
        getCategories: vi.fn(),
        createCategory: vi.fn()
    }
}));

describe('CategoryManager', () => {
    const mockOnCategoryChange = vi.fn();
    const mockCategories = [
        { _id: '1', name: 'Technology', slug: 'technology' },
        { _id: '2', name: 'Business', slug: 'business' },
        { _id: '3', name: 'Lifestyle', slug: 'lifestyle' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        categoryService.getCategories.mockResolvedValue({
            success: true,
            data: mockCategories
        });
    });

    describe('Category Selection', () => {
        it('renders category select with options', async () => {
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
            
            await waitFor(() => {
                expect(screen.getByRole('option', { name: 'Technology' })).toBeInTheDocument();
                expect(screen.getByRole('option', { name: 'Business' })).toBeInTheDocument();
                expect(screen.getByRole('option', { name: 'Lifestyle' })).toBeInTheDocument();
            });
        });

        it('shows selected category', async () => {
            render(
                <CategoryManager
                    selectedCategory="Technology"
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();
            });
        });

        it('calls onCategoryChange when selection changes', async () => {
            const user = userEvent.setup();
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('option', { name: 'Business' })).toBeInTheDocument();
            });

            const select = screen.getByLabelText(/category/i);
            await user.selectOptions(select, 'Business');

            expect(mockOnCategoryChange).toHaveBeenCalledWith('Business');
        });
    });

    describe('Add New Category', () => {
        it('shows add category form when plus button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            const addButton = screen.getByTitle('Add new category');
            await user.click(addButton);

            expect(screen.getByText('Add New Category')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter category name')).toBeInTheDocument();
        });

        it('adds new category when form is submitted', async () => {
            const user = userEvent.setup();
            categoryService.createCategory.mockResolvedValue({
                success: true,
                data: { _id: '4', name: 'Health', slug: 'health' }
            });

            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            // Open add form
            const addButton = screen.getByTitle('Add new category');
            await user.click(addButton);

            // Enter new category
            const input = screen.getByPlaceholderText('Enter category name');
            await user.type(input, 'Health');

            // Submit form
            const submitButton = screen.getByRole('button', { name: '' }); // Check icon button
            await user.click(submitButton);

            expect(categoryService.createCategory).toHaveBeenCalledWith({ name: 'Health' });
        });

        it('prevents duplicate categories', async () => {
            const user = userEvent.setup();
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('option', { name: 'Technology' })).toBeInTheDocument();
            });

            // Open add form
            const addButton = screen.getByTitle('Add new category');
            await user.click(addButton);

            // Try to add existing category
            const input = screen.getByPlaceholderText('Enter category name');
            await user.type(input, 'Technology');

            const submitButton = screen.getByRole('button', { name: '' }); // Check icon button
            await user.click(submitButton);

            expect(categoryService.createCategory).not.toHaveBeenCalled();
        });

        it('trims whitespace from new categories', async () => {
            const user = userEvent.setup();
            categoryService.createCategory.mockResolvedValue({
                success: true,
                data: { _id: '4', name: 'Health', slug: 'health' }
            });

            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            // Open add form
            const addButton = screen.getByTitle('Add new category');
            await user.click(addButton);

            // Enter category with whitespace
            const input = screen.getByPlaceholderText('Enter category name');
            await user.type(input, '  Health  ');

            const submitButton = screen.getByRole('button', { name: '' }); // Check icon button
            await user.click(submitButton);

            expect(categoryService.createCategory).toHaveBeenCalledWith({ name: 'Health' });
        });

        it('cancels add form when X button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            // Open add form
            const addButton = screen.getByTitle('Add new category');
            await user.click(addButton);

            expect(screen.getByText('Add New Category')).toBeInTheDocument();

            // Cancel form
            const cancelButton = screen.getAllByRole('button', { name: '' })[1]; // X icon button
            await user.click(cancelButton);

            expect(screen.queryByText('Add New Category')).not.toBeInTheDocument();
        });
    });

    describe('Category Management', () => {
        it('shows note about category management', async () => {
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/To edit or delete categories, use the Category Management page/)).toBeInTheDocument();
            });
        });

        // Removed edit functionality - now handled in CategoryManagement page

        // Removed edit functionality - now handled in CategoryManagement page

        // Removed delete functionality - now handled in CategoryManagement page

        // Removed edit functionality - now handled in CategoryManagement page
    });

    describe('Disabled State', () => {
        it('disables controls when disabled prop is true', () => {
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                    disabled={true}
                />
            );

            expect(screen.getByLabelText(/category/i)).toBeDisabled();
            expect(screen.getByTitle('Add new category')).toBeDisabled();
        });
    });

    describe('Required Field', () => {
        it('marks category as required', () => {
            render(
                <CategoryManager
                    selectedCategory=""
                    onCategoryChange={mockOnCategoryChange}
                />
            );

            expect(screen.getByLabelText(/category \*/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/category \*/i)).toHaveAttribute('required');
        });
    });
});