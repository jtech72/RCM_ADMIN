import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        if (process.env.NODE_ENV === 'production') {
            this.logErrorToService(error, errorInfo);
        }
    }

    logErrorToService = (error, errorInfo) => {
        try {
            const errorData = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                context: 'admin-panel',
            };

            fetch('/api/logs/client-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData),
            }).catch(err => {
                console.error('Failed to log error to service:', err);
            });
        } catch (loggingError) {
            console.error('Error in error logging:', loggingError);
        }
    };

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                            Admin Panel Error
                        </h2>

                        <p className="text-gray-600 text-center mb-6">
                            An error occurred in the admin panel. Please try refreshing the page or contact support if the issue persists.
                        </p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Refresh Page
                            </button>

                            <button
                                onClick={() => window.location.href = '/admin/dashboard'}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 p-4 bg-gray-100 rounded-md">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;