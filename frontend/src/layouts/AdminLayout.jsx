import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, FileText, ClipboardCheck, History } from 'lucide-react';
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

    const userRole = localStorage.getItem('role') || 'superadmin';

    const getNavLinks = (role) => {
        const baseLinks = [
            { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Manage Documents', path: '/documents', icon: FileText },
            { name: 'QA & Approvals', path: '/qa-approvals', icon: ClipboardCheck },
            { name: 'Review History', path: '/review-history', icon: History },
        ];

        // Agency Focal Person ONLY gets Documents
        if (role === 'focal_person' || role === 'focal' || role === 'agency-focal-person') {
            return [
                { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Manage Documents', path: '/documents', icon: FileText }
            ];
        }

        // Agency Admin gets Documents AND Users (scoped to their agency)
        if (role === 'agency_admin' || role === 'admin') {
            return [
                { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Manage Documents', path: '/documents', icon: FileText },
                { name: 'Manage Users', path: '/users', icon: Users }
            ];
        }

        // QA and Content Approver ONLY get QA & Approvals
        if (role === 'qa' || role === 'qa-reviewer' || role === 'content_approver' || role === 'content-approver') {
            return [
                { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
                { name: 'QA & Approvals', path: '/qa-approvals', icon: ClipboardCheck },
                { name: 'Review History', path: '/review-history', icon: History }
            ];
        }

        // Knowledge Base Manager (KBM) only manages content
        if (role === 'kbm' || role === 'knowledge_base_manager' || role === 'knowledge-base-manager') return baseLinks;

        // Super Admin gets access to system settings
        return [
            ...baseLinks,
            { name: 'Manage Users', path: '/users', icon: Users },
            { name: 'Manage Agencies', path: '/agencies', icon: Building2 },
        ];
    };
    const navLinks = getNavLinks(userRole);

    const getRoleInitials = (role) => {
        if (role === 'focal_person' || role === 'focal' || role === 'agency-focal-person') return 'FP';
        if (role === 'qa' || role === 'qa-reviewer') return 'QA';
        if (role === 'content_approver' || role === 'content-approver') return 'CA';
        if (role === 'kbm' || role === 'knowledge_base_manager' || role === 'knowledge-base-manager') return 'KB';
        if (role === 'agency_admin' || role === 'admin') return 'AA';
        return 'SA';
    };

    const getRoleTitle = (role) => {
        if (role === 'focal_person' || role === 'focal' || role === 'agency-focal-person') return 'Focal Person';
        if (role === 'qa' || role === 'qa-reviewer') return 'QA Specialist (QA)';
        if (role === 'content_approver' || role === 'content-approver') return 'Content Approver (CA)';
        if (role === 'kbm' || role === 'knowledge_base_manager' || role === 'knowledge-base-manager') return 'Knowledge Base Manager';
        if (role === 'agency_admin' || role === 'admin') return 'Agency Admin';
        return 'Super Admin';
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-slate-50 font-sans text-gray-800">
            {/* Sidebar (Left) */}
            <aside className="w-64 flex flex-col z-20 bg-[#123971]">
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
                                    `flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all ${isActive
                                        ? 'bg-[#11B4D4] text-white font-semibold shadow-sm'
                                        : 'font-medium text-white/70 hover:text-white hover:bg-white/10'
                                    }`
                                }
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
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 z-10 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-[#123971] flex items-center justify-center text-sm font-bold">
                                {getRoleInitials(userRole)}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                Welcome, {getRoleTitle(userRole)}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-gray-200"></div> {/* Divider */}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
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
