import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import Logo from '../assets/logo.png'
function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Clear errors when component mounts
    useEffect(() => {
        clearError();
    }, []); // Remove clearError from dependencies to prevent infinite loop

    const onSubmit = async (data) => {
        clearError();

        const result = await login({
            identifier: data.email, // Backend expects 'identifier' field
            password: data.password,
        });

        if (!result.success) {
            setError('root', {
                type: 'manual',
                message: result.error,
            });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div
            style={{ backgroundColor: '#F4F5F9' }}
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md bg-white w-full shadow pb-8  space-y-8">
                <div className='bg-black w-full flex justify-center py-4'>
                    <img src={Logo} width={130} />
                </div>
                <div className='px-4 pt-2'>
                    <h3 className=" text-center text-xl font-bold text-gray-900">
                        Admin Panel Login
                    </h3>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to manage your blog content
                    </p>
                </div>

                <form className="mt-5 pb-4 px-4 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Display global error */}
                    {(error || errors.root) && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Authentication Error
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {error || errors.root?.message}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <div className="mt-1">
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    type="email"
                                    autoComplete="email"
                                    className={`appearance-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                        } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder="Enter your email"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                                        } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 p-2 flex items-center"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Sign in
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Only admin and editor accounts can access this panel
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;