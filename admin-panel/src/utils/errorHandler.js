// Error handling utilities for the admin panel

export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export class NetworkError extends Error {
    constructor(message = 'Network connection failed') {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class AuthError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthError';
    }
}

// Global error handler setup
export const setupGlobalErrorHandlers = () => {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);

        if (process.env.NODE_ENV === 'production') {
            logErrorToService({
                type: 'unhandledRejection',
                error: event.reason,
                context: 'admin-panel',
                timestamp: new Date().toISOString(),
            });
        }

        event.preventDefault();
    });

    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);

        if (process.env.NODE_ENV === 'production') {
            logErrorToService({
                type: 'uncaughtError',
                error: event.error,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                context: 'admin-panel',
                timestamp: new Date().toISOString(),
            });
        }
    });
};

const logErrorToService = async (errorData) => {
    try {
        await fetch('/api/logs/client-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                ...errorData,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (loggingError) {
        console.error('Failed to log error to service:', loggingError);
    }
};

// Handle API errors with admin-specific messages
export const handleApiError = (error) => {
    if (error.name === 'ApiError') {
        switch (error.status) {
            case 400:
                return 'Invalid request. Please check your input and try again.';
            case 401:
                return 'Your session has expired. Please log in again.';
            case 403:
                return 'You don\'t have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'This resource already exists or conflicts with existing data.';
            case 422:
                return 'Validation failed. Please check your input.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'Server error. Please try again later or contact support.';
            default:
                return error.message || 'An unexpected error occurred.';
        }
    }

    if (error.name === 'NetworkError') {
        return 'Network connection failed. Please check your internet connection.';
    }

    if (error.name === 'ValidationError') {
        return error.message || 'Please check your input and try again.';
    }

    if (error.name === 'AuthError') {
        return 'Authentication failed. Please log in again.';
    }

    return error.message || 'An unexpected error occurred.';
};

// Retry mechanism with exponential backoff
export const retryRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;

            // Don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit)
            if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
                throw error;
            }

            if (attempt === maxRetries) {
                break;
            }

            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

// Show user-friendly error messages with toast notifications
export const showErrorMessage = (error, toast) => {
    const message = handleApiError(error);

    if (toast) {
        toast.error(message);
    } else {
        console.error('Error:', message);
        // Fallback alert for critical errors
        if (error.status >= 500) {
            alert(message);
        }
    }
};

// Handle form validation errors
export const handleFormErrors = (error, setFieldError) => {
    if (error.name === 'ApiError' && error.data?.errors) {
        // Handle validation errors from backend
        Object.entries(error.data.errors).forEach(([field, message]) => {
            if (setFieldError) {
                setFieldError(field, message);
            }
        });
        return true;
    }
    return false;
};