import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, FileText, BarChart3, Users } from 'lucide-react';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
    };

    const dashboardCards = [
        {
            title: 'Blog Management',
            description: 'Create, edit, and manage blog posts',
            icon: FileText,
            path: '/blogs',
            color: 'bg-blue-500'
        },
        {
            title: 'Analytics',
            description: 'View blog performance and statistics',
            icon: BarChart3,
            path: '/analytics',
            color: 'bg-green-500',
            disabled: false
        },
        {
            title: 'User Management',
            description: 'Manage users and permissions',
            icon: Users,
            path: '/users',
            color: 'bg-purple-500',
            disabled: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            {/* <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Blog Admin Panel
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                    {user?.username || user?.email}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {user?.role}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header> */}

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Welcome to the Admin Dashboard
                            </h2>
                            <p className="text-gray-600 mb-2">
                                You are successfully logged in as <strong>{user?.role}</strong>.
                            </p>
                            <p className="text-sm text-gray-500">
                                Choose from the options below to manage your blog system.
                            </p>
                        </div>
                    </div>

                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboardCards.map((card, index) => {
                            const IconComponent = card.icon;
                            return (
                                <div
                                    key={index}
                                    className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    onClick={() => !card.disabled && navigate(card.path)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                                                <IconComponent className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {card.title}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {card.description}
                                                </p>
                                                {card.disabled && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Coming soon
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;