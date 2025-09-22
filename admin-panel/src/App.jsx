import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import Layout from './components/common/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BlogManagement from './pages/BlogManagement.jsx';
import CategoryManagement from './pages/CategoryManagement.jsx';
import Analytics from './pages/Analytics.jsx';
import UserManagement from './pages/UserManagement.jsx';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Analytics />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/blogs"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <BlogManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/categories"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CategoryManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/users"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <UserManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Redirect root to blog management */}
                            <Route path="/" element={<Navigate to="/blogs" replace />} />

                            {/* Catch all route - redirect to dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;