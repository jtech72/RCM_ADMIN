import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, FileText, BarChart3, Users, Home, Tag } from 'lucide-react';
import Logo from '../../assets/logo.png';

function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = () => {
        logout();
    };

    const navigationItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: Home
        },
        {
            name: 'Blogs',
            path: '/blogs',
            icon: FileText
        },
        {
            name: 'Categories',
            path: '/categories',
            icon: Tag
        },
        {
            name: 'Users',
            path: '/users',
            icon: Users
        }
    ];

    const isActivePath = (path) => {
        return location.pathname === path ||
            (path === '/blogs' && location.pathname === '/') ||
            location.pathname.startsWith(path + '/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 shadow dark-primary py-4 px-6" >
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center ">
                        <img src={Logo} alt="Probill Logo" width={130} />
                        <nav role="navigation">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex space-x-8">
                                    {navigationItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = isActivePath(item.path);

                                        return (
                                            <span
                                                style={{ cursor: 'pointer' }}
                                                key={item.name}
                                                onClick={() => navigate(item.path)}
                                                className={`inline-flex items-center px-1 pt-1 pb-1  text-sm text-gray-400 font-medium transition-colors duration-200 ${isActive
                                                    ? ' text-white'
                                                    : ''
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4 mr-2" />
                                                {item.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </nav>
                        <div className="flex items-center space-x-4">
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
            </header>

            <main role="main" className="pt-20">
                {children}
            </main>
        </div>
    );
}

export default Layout;