import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/auth';

// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Action types
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SET_LOADING: 'SET_LOADING',
    CLEAR_ERROR: 'CLEAR_ERROR',
    VERIFY_TOKEN_SUCCESS: 'VERIFY_TOKEN_SUCCESS',
    VERIFY_TOKEN_FAILURE: 'VERIFY_TOKEN_FAILURE',
};

// Reducer function
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        case AUTH_ACTIONS.VERIFY_TOKEN_SUCCESS:
            return {
                ...state,
                user: authService.getCurrentUser(),
                token: authService.getToken(),
                isAuthenticated: true,
                isLoading: false,
            };

        case AUTH_ACTIONS.VERIFY_TOKEN_FAILURE:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };

        default:
            return state;
    }
}

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on app load
    useEffect(() => {
        const initializeAuth = async () => {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

            if (authService.isAuthenticated()) {
                try {
                    const isValid = await authService.verifyToken();
                    if (isValid) {
                        dispatch({ type: AUTH_ACTIONS.VERIFY_TOKEN_SUCCESS });
                    } else {
                        dispatch({ type: AUTH_ACTIONS.VERIFY_TOKEN_FAILURE });
                    }
                } catch (error) {
                    dispatch({ type: AUTH_ACTIONS.VERIFY_TOKEN_FAILURE });
                }
            } else {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });

        try {
            const { token, user } = await authService.login(credentials);
            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { token, user }
            });
            return { success: true };
        } catch (error) {
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: error.message
            });
            return { success: false, error: error.message };
        }
    };

    // Logout function
    const logout = () => {
        authService.logout();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    // Clear error function
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    // Context value
    const value = {
        ...state,
        login,
        logout,
        clearError,
        isAdmin: () => authService.isAdmin(),
        canEdit: () => authService.canEdit(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;