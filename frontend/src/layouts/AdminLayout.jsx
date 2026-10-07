import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, FileText, ClipboardCheck, History, Bell, Menu, X } from 'lucide-react';
import Swal from 'sweetalert2';
import mainLogo from '../assets/k-owl-main-logo.png';
import api from '../utils/api';

const AdminLayout = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    const [pendingUsers, setPendingUsers] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [readNotifs, setReadNotifs] = useState(() => {
        const saved = localStorage.getItem('readNotifs');
        return saved ? JSON.parse(saved) : [];
    });
    const dropdownRef = useRef(null);
    const userRole = localStorage.getItem('role') || 'superadmin';

    const unreadCount = pendingUsers.filter(user => !readNotifs.includes(user.id)).length;

    useEffect(() => {
        if (userRole === 'superadmin' || userRole === 'agency_admin' || userRole === 'admin') {
            const fetchPendingList = async () => {
                try {
                    const res = await api.get('/api/users/pending-list');
                    setPendingUsers(res.data);
                } catch (error) {
                    console.error("Failed to fetch pending users list", error);
                }
            };
            fetchPendingList();
        }
    }, [userRole]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const getNavLinks = (role) => {
        const baseLinks = [
            { name: 'Overview', path: `/${roleSlug}/dashboard`, icon: LayoutDashboard },
            { name: 'Manage Documents', path: `/${roleSlug}/documents`, icon: FileText },
            { name: 'QA & Approvals', path: `/${roleSlug}/qa-approvals`, icon: ClipboardCheck },
            { name: 'Review History', path: `/${roleSlug}/review-history`, icon: History },
        ];

        // Agency Focal Person ONLY gets Documents
        if (role === 'focal_person' || role === 'focal' || role === 'agency-focal-person') {
            return [
                { name: 'Overview', path: `/${roleSlug}/dashboard`, icon: LayoutDashboard },
                { name: 'Manage Documents', path: `/${roleSlug}/documents`, icon: FileText }
            ];
        }

        // Agency Admin gets Documents AND Users (scoped to their agency)
        if (role === 'agency_admin' || role === 'admin') {
            return [
                { name: 'Overview', path: `/${roleSlug}/dashboard`, icon: LayoutDashboard },
                { name: 'Manage Documents', path: `/${roleSlug}/documents`, icon: FileText },
                { name: 'Manage Users', path: `/${roleSlug}/users`, icon: Users }
            ];
        }

        // QA and Content Approver ONLY get QA & Approvals
        if (role === 'qa' || role === 'qa-reviewer' || role === 'content_approver' || role === 'content-approver') {
            return [
                { name: 'Overview', path: `/${roleSlug}/dashboard`, icon: LayoutDashboard },
                { name: 'QA & Approvals', path: `/${roleSlug}/qa-approvals`, icon: ClipboardCheck },
                { name: 'Review History', path: `/${roleSlug}/review-history`, icon: History }
            ];
        }

        // Knowledge Base Manager (KBM) only manages content
        if (role === 'kbm' || role === 'knowledge_base_manager' || role === 'knowledge-base-manager') return baseLinks;

        // Super Admin gets access to system settings
        return [
            ...baseLinks,
            { name: 'Manage Users', path: `/${roleSlug}/users`, icon: Users },
            { name: 'Manage Agencies', path: `/${roleSlug}/agencies`, icon: Building2 },
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
            
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity backdrop-blur-sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Left) */}
            <aside className={`w-64 flex flex-col z-50 bg-[#123971] fixed lg:static top-0 left-0 h-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Branding / Top of Sidebar */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/10">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full shadow-lg flex-shrink-0 flex items-center justify-center">
                            <img src={mainLogo} alt="K-OWL Logo" className="h-8 w-8 object-contain" />
                        </div>
                        <h1 className="text-2xl font-black tracking-widest drop-shadow-md">
                            <span style={{ color: secondaryCyan }}>K</span>
                            <span className="text-white">-OWL</span>
                        </h1>
                    </div>
                    <button 
                        className="lg:hidden text-white/70 hover:text-white p-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-4 text-sm rounded-lg transition-all ${isActive
                                        ? 'bg-[#11B4D4] text-white font-semibold shadow-sm'
                                        : 'font-medium text-white/70 hover:text-white hover:bg-white/10'
                                    }`
                                }
                            >
                                <Icon className="w-6 h-6" />
                                <span className="flex items-center gap-2">
                                    {link.name}
                                    {link.name === 'Manage Users' && unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                            {unreadCount} NEW
                                        </span>
                                    )}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area Wrapper */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header (Top Right) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between lg:justify-end px-4 lg:px-8 z-10 shrink-0 shadow-sm">
                    {/* Mobile Hamburger Menu */}
                    <button 
                        className="lg:hidden p-2 text-gray-500 hover:text-[#123971] hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-8">
                        <div className="relative mr-4" ref={dropdownRef}>
                            {/* Bell Icon & Badge */}
                            <div className="cursor-pointer" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                                <Bell className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {/* Dropdown Menu */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-fade-in">
                                    <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                                    </div>
                                    
                                    <div className="max-h-72 overflow-y-auto">
                                        {pendingUsers.length > 0 ? (
                                            pendingUsers.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => {
                                                        // Mark as read
                                                        if (!readNotifs.includes(user.id)) {
                                                            const updatedRead = [...readNotifs, user.id];
                                                            setReadNotifs(updatedRead);
                                                            localStorage.setItem('readNotifs', JSON.stringify(updatedRead));
                                                        }
                                                        // Navigate and close dropdown
                                                        setIsNotifOpen(false);
                                                        navigate(`/${userRole}/users?userId=${user.id}`);
                                                    }}
                                                    className={`px-4 py-4 border-b border-gray-100 cursor-pointer transition-colors ${
                                                        readNotifs.includes(user.id) ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                                                    }`}
                                                >
                                                    <p className="text-sm text-gray-700">
                                                        {!readNotifs.includes(user.id) && (
                                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 shrink-0"></span>
                                                        )}
                                                        <span className="font-bold text-gray-900">{user.username}</span> registered and is awaiting your approval.
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1 pl-4">{user.email}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No new notifications.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-[#123971] flex items-center justify-center text-sm font-bold">
                                {getRoleInitials(userRole)}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                Welcome, {getRoleTitle(userRole)}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-gray-200"></div> {/* Divider */}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
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
