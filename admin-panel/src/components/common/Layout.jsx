import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, FileText, Users, Home, Tag, Menu, X } from 'lucide-react';
import Logo from '../../assets/logo.png';
import Plogo from '../../assets/logo_sm.png';

function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar for desktop */}
            <div className={`hidden lg:flex flex-col bg-white shadow-xl transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="flex dark-primary relative items-center justify-center px-4 py-5 border-b border-gray-200 flex-shrink-0">
                    {isSidebarOpen ? (
                        <img src={Logo} alt="Probill Logo" width={130} className="transition-opacity duration-300" />
                    ) : (
                        <div className="w-8 h-8  rounded-lg flex items-center justify-center">
                            <img src={Plogo} alt="Probill Logo" width={30} />
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg absolute right-0"
                    >
                        <Menu className="h-4 w-4 text-white" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 dark-primary px-0 py-0 space-y-1 overflow-y-auto">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.path);

                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'text-orange-400 hover:bg-gray-50 hover:text-gray-900'
                                    : 'text-white hover:bg-gray-50 hover:text-gray-900'
                                    } ${!isSidebarOpen ? 'justify-center' : ''}`}
                            >
                                <Icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                                {isSidebarOpen && (
                                    <span className="transition-opacity duration-300">{item.name}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section & Logout */}
                <div className="p-4 dark-primary border-t border-gray-200 flex-shrink-0">
                    <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        {isSidebarOpen && (
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className={`p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 ${!isSidebarOpen ? 'mt-2' : ''
                                }`}
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5 text-gray-600" />
                    ) : (
                        <Menu className="h-5 w-5 text-gray-600" />
                    )}
                </button>
            </div>

            {/* Mobile sidebar overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } overflow-hidden`}>
                <div className="flex flex-col h-full">
                    {/* Mobile Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                        <img src={Logo} alt="Probill Logo" width={130} />
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Mobile Navigation Items */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActivePath(item.path);

                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Mobile User Section */}
                    <div className="p-4 border-t border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : 'lg:ml-20'
                }`}>
                {/* Top Header for mobile */}
                <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-center items-center">
                            <img src={Logo} alt="Probill Logo" width={120} />
                        </div>
                    </div>
                </header>

                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-hidden p-4 px-0">
                    <div className=" mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Layout;