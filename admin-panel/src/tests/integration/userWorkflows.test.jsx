import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from '../../App'
import { AuthProvider } from '../../contexts/AuthContext'
import * as authService from '../../services/auth'
import * as blogService from '../../services/blog'
import * as userService from '../../services/user'

// Mock services
vi.mock('../../services/auth')
vi.mock('../../services/blog')
vi.mock('../../services/user')
vi.mock('../../services/s3')

const createTestWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    return ({ children }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </QueryClientProvider>
        </BrowserRouter>
    )
}

describe('Admin Panel User Workflows', () => {
    let user
    const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        token: 'mock-token'
    }

    beforeEach(() => {
        user = userEvent.setup()
        vi.clearAllMocks()
        localStorage.clear()

        // Mock successful authentication by default
        authService.login.mockResolvedValue({
            success: true,
            data: mockUser
        })

        authService.getCurrentUser.mockResolvedValue({
            success: true,
            data: mockUser
        })
    })

    describe('Authentication Workflow', () => {
        it('should complete full login workflow', async () => {
            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Should show login form initially
            expect(screen.getByText(/sign in to admin panel/i)).toBeInTheDocument()

            // Fill in login form
            await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')

            // Submit form
            await user.click(screen.getByRole('button', { name: /sign in/i }))

            // Should redirect to dashboard after successful login
            await waitFor(() => {
                expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
            })

            expect(authService.login).toHaveBeenCalledWith({
                email: 'admin@test.com',
                password: 'password123'
            })
        })

        it('should handle login errors gracefully', async () => {
            authService.login.mockRejectedValue(new Error('Invalid credentials'))

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
            await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
            await user.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
            })
        })
    })

    describe('Blog Management Workflow', () => {
        beforeEach(() => {
            // Mock authenticated state
            localStorage.setItem('token', 'mock-token')
            localStorage.setItem('user', JSON.stringify(mockUser))
        })

        it('should complete blog creation workflow', async () => {
            const mockBlog = {
                id: '1',
                title: 'Test Blog',
                content: '<p>Test content</p>',
                status: 'draft'
            }

            blogService.getBlogs.mockResolvedValue({
                success: true,
                data: { blogs: [], pagination: { total: 0, pages: 0 } }
            })

            blogService.createBlog.mockResolvedValue({
                success: true,
                data: mockBlog
            })

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Navigate to blog management
            await user.click(screen.getByText(/blogs/i))

            await waitFor(() => {
                expect(screen.getByText(/blog management/i)).toBeInTheDocument()
            })

            // Click create new blog
            await user.click(screen.getByText(/create new blog/i))

            // Fill in blog form
            await user.type(screen.getByLabelText(/title/i), 'Test Blog')
            await user.type(screen.getByLabelText(/excerpt/i), 'Test excerpt')

            // Select category
            await user.selectOptions(screen.getByLabelText(/category/i), 'Technology')

            // Submit form
            await user.click(screen.getByRole('button', { name: /create blog/i }))

            await waitFor(() => {
                expect(blogService.createBlog).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Test Blog',
                        excerpt: 'Test excerpt',
                        category: 'Technology'
                    })
                )
            })
        })

        it('should handle blog editing workflow', async () => {
            const mockBlog = {
                id: '1',
                title: 'Existing Blog',
                content: '<p>Existing content</p>',
                excerpt: 'Existing excerpt',
                category: 'Technology',
                status: 'published'
            }

            blogService.getBlogs.mockResolvedValue({
                success: true,
                data: { blogs: [mockBlog], pagination: { total: 1, pages: 1 } }
            })

            blogService.getBlog.mockResolvedValue({
                success: true,
                data: mockBlog
            })

            blogService.updateBlog.mockResolvedValue({
                success: true,
                data: { ...mockBlog, title: 'Updated Blog' }
            })

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Navigate to blog management
            await user.click(screen.getByText(/blogs/i))

            await waitFor(() => {
                expect(screen.getByText(/existing blog/i)).toBeInTheDocument()
            })

            // Click edit button
            await user.click(screen.getByLabelText(/edit existing blog/i))

            // Update title
            const titleInput = screen.getByDisplayValue('Existing Blog')
            await user.clear(titleInput)
            await user.type(titleInput, 'Updated Blog')

            // Submit form
            await user.click(screen.getByRole('button', { name: /update blog/i }))

            await waitFor(() => {
                expect(blogService.updateBlog).toHaveBeenCalledWith(
                    '1',
                    expect.objectContaining({
                        title: 'Updated Blog'
                    })
                )
            })
        })
    })

    describe('User Management Workflow', () => {
        beforeEach(() => {
            localStorage.setItem('token', 'mock-token')
            localStorage.setItem('user', JSON.stringify(mockUser))
        })

        it('should complete user creation workflow', async () => {
            const mockUsers = [
                { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' }
            ]

            userService.getUsers.mockResolvedValue({
                success: true,
                data: { users: mockUsers, pagination: { total: 1, pages: 1 } }
            })

            userService.createUser.mockResolvedValue({
                success: true,
                data: { id: '2', username: 'editor', email: 'editor@test.com', role: 'editor' }
            })

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Navigate to user management
            await user.click(screen.getByText(/users/i))

            await waitFor(() => {
                expect(screen.getByText(/user management/i)).toBeInTheDocument()
            })

            // Click create new user
            await user.click(screen.getByText(/create new user/i))

            // Fill in user form
            await user.type(screen.getByLabelText(/username/i), 'editor')
            await user.type(screen.getByLabelText(/email/i), 'editor@test.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.selectOptions(screen.getByLabelText(/role/i), 'editor')

            // Submit form
            await user.click(screen.getByRole('button', { name: /create user/i }))

            await waitFor(() => {
                expect(userService.createUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        username: 'editor',
                        email: 'editor@test.com',
                        role: 'editor'
                    })
                )
            })
        })
    })

    describe('Analytics Workflow', () => {
        beforeEach(() => {
            localStorage.setItem('token', 'mock-token')
            localStorage.setItem('user', JSON.stringify(mockUser))
        })

        it('should display analytics dashboard with data', async () => {
            const mockAnalytics = {
                overview: {
                    totalBlogs: 25,
                    totalViews: 1500,
                    totalLikes: 300,
                    totalUsers: 10
                },
                popularBlogs: [
                    { id: '1', title: 'Popular Blog 1', views: 500, likes: 100 },
                    { id: '2', title: 'Popular Blog 2', views: 400, likes: 80 }
                ],
                engagementData: [
                    { date: '2024-01-01', views: 100, likes: 20 },
                    { date: '2024-01-02', views: 150, likes: 30 }
                ]
            }

            // Mock analytics service
            vi.doMock('../../services/analytics', () => ({
                getAnalytics: vi.fn().mockResolvedValue({
                    success: true,
                    data: mockAnalytics
                })
            }))

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Navigate to analytics
            await user.click(screen.getByText(/analytics/i))

            await waitFor(() => {
                expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
                expect(screen.getByText('25')).toBeInTheDocument() // Total blogs
                expect(screen.getByText('1,500')).toBeInTheDocument() // Total views
                expect(screen.getByText(/popular blog 1/i)).toBeInTheDocument()
            })
        })
    })

    describe('Error Handling Workflows', () => {
        beforeEach(() => {
            localStorage.setItem('token', 'mock-token')
            localStorage.setItem('user', JSON.stringify(mockUser))
        })

        it('should handle network errors gracefully', async () => {
            blogService.getBlogs.mockRejectedValue(new Error('Network error'))

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            await user.click(screen.getByText(/blogs/i))

            await waitFor(() => {
                expect(screen.getByText(/error loading blogs/i)).toBeInTheDocument()
            })
        })

        it('should handle unauthorized access', async () => {
            authService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'))

            const TestWrapper = createTestWrapper()

            render(
                <TestWrapper>
                    <App />
                </TestWrapper>
            )

            // Should redirect to login
            await waitFor(() => {
                expect(screen.getByText(/sign in to admin panel/i)).toBeInTheDocument()
            })
        })
    })
})