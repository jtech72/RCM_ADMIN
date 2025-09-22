import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from '../TagManager.jsx';

describe('TagManager', () => {
    const mockOnTagsChange = vi.fn();
    const mockOnAvailableTagsUpdate = vi.fn();
    const defaultAvailableTags = ['javascript', 'react', 'nodejs', 'css'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Tag Display', () => {
        it('renders tag input with label', () => {
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            expect(screen.getByText(/tags/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Add a tag')).toBeInTheDocument();
        });

        it('displays selected tags', () => {
            render(
                <TagManager
                    selectedTags={['javascript', 'react']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.getByText('Tags (2/10)')).toBeInTheDocument();
        });

        it('shows tag count in label', () => {
            render(
                <TagManager
                    selectedTags={['javascript', 'react', 'nodejs']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                    maxTags={5}
                />
            );

            expect(screen.getByText('Tags (3/5)')).toBeInTheDocument();
        });
    });

    describe('Adding Tags', () => {
        it('adds tag when Add button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            const addButton = screen.getByRole('button', { name: '' }); // Plus icon

            await user.type(input, 'typescript');
            await user.click(addButton);

            expect(mockOnTagsChange).toHaveBeenCalledWith(['typescript']);
        });

        it('adds tag when Enter key is pressed', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'typescript');
            await user.keyboard('{Enter}');

            expect(mockOnTagsChange).toHaveBeenCalledWith(['typescript']);
        });

        it('prevents duplicate tags', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={['javascript']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(input, 'javascript');
            await user.click(addButton);

            expect(mockOnTagsChange).not.toHaveBeenCalled();
        });

        it('trims whitespace from tags', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(input, '  typescript  ');
            await user.click(addButton);

            expect(mockOnTagsChange).toHaveBeenCalledWith(['typescript']);
        });

        it('ignores empty tags', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(input, '   ');
            await user.click(addButton);

            expect(mockOnTagsChange).not.toHaveBeenCalled();
        });

        it('adds new tag to available tags', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            const addButton = screen.getByRole('button', { name: '' });

            await user.type(input, 'typescript');
            await user.click(addButton);

            expect(mockOnAvailableTagsUpdate).toHaveBeenCalledWith([...defaultAvailableTags, 'typescript']);
        });
    });

    describe('Removing Tags', () => {
        it('removes tag when X button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={['javascript', 'react']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const removeButton = screen.getAllByTitle(/remove.*tag/i)[0];
            await user.click(removeButton);

            expect(mockOnTagsChange).toHaveBeenCalledWith(['react']);
        });

        it('removes last tag when backspace is pressed on empty input', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={['javascript', 'react']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.click(input);
            await user.keyboard('{Backspace}');

            expect(mockOnTagsChange).toHaveBeenCalledWith(['javascript']);
        });
    });

    describe('Tag Suggestions', () => {
        it('shows suggestions when typing', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'java');

            await waitFor(() => {
                expect(screen.getByText('javascript')).toBeInTheDocument();
            });
        });

        it('filters suggestions based on input', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'react');

            await waitFor(() => {
                expect(screen.getByText('react')).toBeInTheDocument();
                expect(screen.queryByText('javascript')).not.toBeInTheDocument();
            });
        });

        it('excludes already selected tags from suggestions', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={['javascript']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'java');

            await waitFor(() => {
                expect(screen.queryByText('javascript')).not.toBeInTheDocument();
            });
        });

        it('adds tag when suggestion is clicked', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'java');

            await waitFor(() => {
                const suggestion = screen.getByText('javascript');
                return user.click(suggestion);
            });

            expect(mockOnTagsChange).toHaveBeenCalledWith(['javascript']);
        });

        it('hides suggestions when Escape is pressed', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const input = screen.getByPlaceholderText('Add a tag');
            await user.type(input, 'java');

            await waitFor(() => {
                expect(screen.getByText('javascript')).toBeInTheDocument();
            });

            await user.keyboard('{Escape}');

            expect(screen.queryByText('javascript')).not.toBeInTheDocument();
        });
    });

    describe('Popular Tags', () => {
        it('shows popular tags section', () => {
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            expect(screen.getByText('Popular tags:')).toBeInTheDocument();
            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('react')).toBeInTheDocument();
        });

        it('excludes selected tags from popular tags', () => {
            render(
                <TagManager
                    selectedTags={['javascript']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.queryByText('javascript')).not.toBeInTheDocument();
        });

        it('adds tag when popular tag is clicked', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={[]}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                />
            );

            const popularTag = screen.getByRole('button', { name: 'javascript' });
            await user.click(popularTag);

            expect(mockOnTagsChange).toHaveBeenCalledWith(['javascript']);
        });
    });

    describe('Max Tags Limit', () => {
        it('disables input when max tags reached', () => {
            render(
                <TagManager
                    selectedTags={['tag1', 'tag2']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                    maxTags={2}
                />
            );

            const input = screen.getByPlaceholderText('Maximum 2 tags allowed');
            expect(input).toBeDisabled();
        });

        it('prevents adding tags when max reached', async () => {
            const user = userEvent.setup();
            render(
                <TagManager
                    selectedTags={['tag1', 'tag2']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                    maxTags={2}
                />
            );

            const addButton = screen.getByRole('button', { name: '' });
            expect(addButton).toBeDisabled();
        });
    });

    describe('Disabled State', () => {
        it('disables all controls when disabled prop is true', () => {
            render(
                <TagManager
                    selectedTags={['javascript']}
                    onTagsChange={mockOnTagsChange}
                    availableTags={defaultAvailableTags}
                    onAvailableTagsUpdate={mockOnAvailableTagsUpdate}
                    disabled={true}
                />
            );

            expect(screen.getByPlaceholderText('Add a tag')).toBeDisabled();
            expect(screen.getByRole('button', { name: '' })).toBeDisabled(); // Plus button
        });
    });
});