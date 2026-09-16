import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import mainLogo from '../assets/k-owl-main-logo.png';

const AdminLayout = () => {
    const navigate = useNavigate();
    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure you want to log out?',
            text: "You will need to sign in again to access the dashboard.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, log out'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        });
    };

    const navLinks = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Manage Users', path: '/users', icon: Users },
        { name: 'Manage Agencies', path: '/agencies', icon: Building2 },
    ];

    return (
        <div className="h-screen w-full flex overflow-hidden bg-gray-50 font-sans text-gray-800">
            {/* Sidebar (Left) */}
            <aside className="w-64 flex flex-col shadow-2xl z-20" style={{ backgroundColor: primaryNavy }}>
                {/* Branding / Top of Sidebar */}
                <div className="h-16 flex items-center px-6 border-b border-white/10 bg-black/10 gap-3">
                    <div className="bg-white p-1.5 rounded-full shadow-lg flex-shrink-0 flex items-center justify-center">
                        <img src={mainLogo} alt="K-OWL Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <h1 className="text-2xl font-black tracking-widest drop-shadow-md">
                        <span style={{ color: secondaryCyan }}>K</span>
                        <span className="text-white">-OWL</span>
                    </h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-medium ${
                                        isActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                                style={({ isActive }) => isActive ? { borderLeft: `4px solid ${secondaryCyan}` } : { borderLeft: '4px solid transparent' }}
                            >
                                <Icon className="w-5 h-5" />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area Wrapper */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header (Top Right) */}
                <header className="h-20 bg-white shadow-sm border-b border-gray-200 flex items-center justify-end px-8 z-10 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: secondaryCyan }}>
                                SA
                            </div>
                            <span className="font-semibold text-gray-700">Welcome, Super Admin</span>
                        </div>
                        
                        <div className="h-8 w-px bg-gray-200"></div> {/* Divider */}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors font-semibold"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {/* React Router injects the matching child route component here */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
