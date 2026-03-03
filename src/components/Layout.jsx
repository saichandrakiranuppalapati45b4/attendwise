import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    CheckSquare,
    BarChart3,
    User,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Users as AdminUsers,
    BarChart,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLoginModal from './AdminLoginModal';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Shortcut: Ctrl + Shift + S
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (user?.email === '24pa1a45b4@vishnu.edu.in') {
                    setIsAdminModalOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Attendance', href: '/attendance', icon: CheckSquare },
        { name: 'Timetable', href: '/timetable', icon: CalendarDays },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    const adminNavigation = [
        { name: 'Admin Overview', href: '/admin', icon: ShieldCheck },
        { name: 'Student Directory', href: '/admin/students', icon: AdminUsers },
        { name: 'System Stats', href: '/admin/stats', icon: BarChart },
        { name: 'Back to App', href: '/', icon: ArrowLeft },
    ];

    const isAdminRoute = location.pathname.startsWith('/admin');
    const activeNavigation = isAdminRoute ? adminNavigation : navigation;

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link to={isAdminRoute ? "/admin" : "/"} className={`text-2xl font-bold ${isAdminRoute ? 'text-purple-600' : 'text-blue-600'}`}>
                        {isAdminRoute ? 'AttendAdmin' : 'AttendWise'}
                    </Link>
                    <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={toggleSidebar}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {activeNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors
                  ${isActive
                                        ? (isAdminRoute ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700')
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? (isAdminRoute ? 'text-purple-700' : 'text-blue-700') : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between">
                    <Link to="/" className="text-xl font-bold text-blue-600">AttendWise</Link>
                    <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 flex flex-col">
                    <div className="flex-1 p-4 lg:p-8">
                        {children}
                    </div>
                    {/* Footer */}
                    <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
                        Made with <span className="text-red-500 mx-1">❤️</span> by GJV and KV
                    </footer>
                </main>
            </div>

            <AdminLoginModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                onConfirm={() => window.open('/admin', '_blank')}
            />
        </div>
    );
};

export default Layout;
