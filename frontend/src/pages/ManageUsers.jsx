import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, Briefcase, Building, Edit, UserX, UserCheck, Loader2, X } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Form Dropdown Data
    const [agencies, setAgencies] = useState([]);
    const [roles, setRoles] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        designation: '',
        roleId: '',
        agencyId: ''
    });

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        fetchUsers();
        fetchMetadata();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            let fetchedUsers = res.data;
            
            const userRole = localStorage.getItem('role') || 'superadmin';
            const userAgencyId = localStorage.getItem('agencyId');
            
            if (userRole === 'agency_admin' || userRole === 'admin') {
                fetchedUsers = fetchedUsers.filter(u => u.agencyId === parseInt(userAgencyId));
            }
            
            setUsers(fetchedUsers);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch users", error);
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Users',
                text: error.response?.data?.error || 'Could not fetch user data. Please try again.',
                confirmButtonColor: secondaryCyan
            });
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [agenciesRes, rolesRes] = await Promise.all([
                api.get('/api/agencies'),
                api.get('/api/roles')
            ]);
            setAgencies(agenciesRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error("Failed to fetch metadata", error);
        }
    };

    // Derived filtered users
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            (user.username && user.username.toLowerCase().includes(lowerQuery)) ||
            (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
            (user.designation && user.designation.toLowerCase().includes(lowerQuery))
        );
    });

    // Pagination logic
    const usersPerPage = 5;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Toggle Status
    const handleToggleStatus = () => {
        if (!selectedUser) return;
        const actionText = selectedUser.isActive ? 'deactivate' : 'reactivate';
        
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to ${actionText} this user's account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: selectedUser.isActive ? '#d33' : '#22c55e',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${actionText}!`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await api.patch(`/api/users/${selectedUser.id}/status`);
                    const updatedUser = res.data;
                    
                    // Update local state
                    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                    setSelectedUser(updatedUser);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `User has been successfully ${actionText}d.`,
                        confirmButtonColor: secondaryCyan
                    });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.error || 'Failed to change user status.',
                        confirmButtonColor: secondaryCyan
                    });
                }
            }
        });
    };

    const handleApprovalStatus = async (status) => {
        if (!selectedUser) return;
        
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to ${status.toLowerCase()} this user's account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'APPROVED' ? '#22c55e' : '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${status.toLowerCase()}!`
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await api.patch(`/api/users/${selectedUser.id}/approval`, { status });
                    const updatedUser = res.data;
                    
                    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                    setSelectedUser(updatedUser);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `User has been successfully ${status.toLowerCase()}.`,
                        confirmButtonColor: secondaryCyan
                    });
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.error || `Failed to ${status.toLowerCase()} user.`,
                        confirmButtonColor: secondaryCyan
                    });
                }
            }
        });
    };

    // Handlers for Modals
    const handleAddClick = () => {
        setFormData({ username: '', email: '', password: '', designation: '', roleId: '', agencyId: '' });
        setIsAddModalOpen(true);
    };

    const handleEditClick = () => {
        if (!selectedUser) return;
        setFormData({
            username: selectedUser.username,
            email: selectedUser.email,
            designation: selectedUser.designation || '',
            roleId: selectedUser.roleId,
            agencyId: selectedUser.agencyId
        });
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                roleId: parseInt(formData.roleId),
                agencyId: parseInt(formData.agencyId)
            };
            
            await api.post('/api/auth/register', payload);
            
            // Re-fetch users since /api/auth/register might not return the full populated user immediately
            await fetchUsers();
            
            setIsAddModalOpen(false);
            Swal.fire({
                icon: 'success',
                title: 'User Created',
                text: 'New user has been successfully added to the system.',
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: error.response?.data?.error || 'Please check your inputs.',
                confirmButtonColor: secondaryCyan
            });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                designation: formData.designation,
                roleId: parseInt(formData.roleId),
                agencyId: parseInt(formData.agencyId)
            };
            
            const res = await api.patch(`/api/users/${selectedUser.id}`, payload);
            const updatedUser = res.data;
            
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser);
            
            setIsEditModalOpen(false);
            Swal.fire({
                icon: 'success',
                title: 'User Updated',
                text: 'User profile has been successfully updated.',
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.response?.data?.error || 'Failed to update user profile.',
                confirmButtonColor: secondaryCyan
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-gray-500 font-medium">Loading user directory...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px] relative">
            
            {/* LEFT PANEL: Detail View (1/3) */}
            <div className="w-full lg:w-1/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                        <div className="bg-gray-50 p-6 rounded-full mb-4 ring-8 ring-gray-50/50">
                            <User size={48} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-500 mb-1">No User Selected</h3>
                        <p className="text-center text-sm font-medium">Select a user from the list to view and edit their details.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-fade-in">
                        {/* Profile Header */}
                        <div className="p-8 flex flex-col items-center border-b border-gray-100 relative">
                            {/* Status Dot */}
                            <div className="absolute top-6 right-6 flex flex-col gap-2">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <div className={`w-2.5 h-2.5 rounded-full ${selectedUser.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                                    <span className={`text-xs font-bold ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                {selectedUser.status && (
                                    <div className={`flex items-center justify-center px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wider ${
                                        selectedUser.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                        selectedUser.status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                        'bg-amber-50 border-amber-100 text-amber-600'
                                    }`}>
                                        {selectedUser.status}
                                    </div>
                                )}
                            </div>

                            {/* Avatar */}
                            <div 
                                className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4"
                                style={{ background: `linear-gradient(135deg, ${primaryNavy}, ${secondaryCyan})` }}
                            >
                                {selectedUser.username.substring(0, 2).toUpperCase()}
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-800">{selectedUser.username}</h2>
                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-2">
                                <Mail size={14} className="text-gray-400" /> {selectedUser.email}
                            </p>
                            
                            <div className="mt-5 px-4 py-1.5 bg-[#123971]/5 text-[#123971] text-xs font-black uppercase tracking-widest rounded-full border border-[#123971]/10">
                                {selectedUser.roleSlug?.replace(/-/g, ' ')}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="p-8 space-y-6 flex-1">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Professional Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                        <Briefcase size={18} style={{ color: secondaryCyan }} />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium">Designation</span>
                                            <span className="font-bold">{selectedUser.designation || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                        <Building size={18} style={{ color: secondaryCyan }} />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium">Agency</span>
                                            <span className="font-bold">{selectedUser.agencyName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3">
                            {selectedUser.status === 'PENDING' ? (
                                <>
                                    <button 
                                        onClick={() => handleApprovalStatus('APPROVED')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                                    >
                                        <UserCheck size={16} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleApprovalStatus('REJECTED')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm"
                                    >
                                        <UserX size={16} /> Reject
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleEditClick}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
                                    >
                                        <Edit size={16} /> Edit Profile
                                    </button>
                                    <button 
                                        onClick={handleToggleStatus}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                                            selectedUser.isActive 
                                            ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300' 
                                            : 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300'
                                        }`}
                                    >
                                        {selectedUser.isActive ? <><UserX size={16} /> Deactivate</> : <><UserCheck size={16} /> Reactivate</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: List View (2/3) */}
            <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">User Directory</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Manage system access and roles</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                placeholder="Search by name, email..." 
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:border-transparent transition-all font-medium text-sm"
                                style={{ '--tw-ring-color': secondaryCyan }}
                            />
                        </div>
                        <button 
                            onClick={handleAddClick}
                            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: secondaryCyan, boxShadow: `0 10px 20px -5px ${secondaryCyan}60` }}
                        >
                            <Plus size={18} strokeWidth={3} /> Add User
                        </button>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
                    {currentUsers.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No users found.</div>
                    ) : (
                        currentUsers.map(user => {
                            const isSelected = selectedUser?.id === user.id;
                            return (
                                <div 
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                                        isSelected 
                                        ? 'bg-[#11B4D4]/5 border-[#11B4D4] shadow-sm' 
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                                    } ${!user.isActive ? 'opacity-70' : ''}`}
                                    style={isSelected ? { borderLeftWidth: '4px', borderLeftColor: secondaryCyan } : { borderLeftWidth: '4px', borderLeftColor: 'transparent' }}
                                >
                                    <div className="flex items-center gap-5">
                                        <div 
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm transform transition-transform group-hover:scale-105 ${!user.isActive ? 'grayscale' : ''}`} 
                                            style={{ backgroundColor: primaryNavy }}
                                        >
                                            {user.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-base group-hover:text-[#11B4D4] transition-colors flex items-center gap-2">
                                                {user.username}
                                                {!user.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Inactive</span>}
                                                {user.status === 'PENDING' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">Pending</span>}
                                                {user.status === 'REJECTED' && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">Rejected</span>}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold tracking-wider rounded-lg border border-gray-200">
                                            {user.agencyName}
                                        </div>
                                        
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-white text-[#11B4D4] shadow-sm' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-600'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">
                        Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-colors ${currentPage === 1 ? 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${currentPage === page ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                    style={currentPage === page ? { backgroundColor: secondaryCyan } : {}}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-colors ${(currentPage === totalPages || totalPages === 0) ? 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* OVERLAYS: ADD & EDIT MODALS */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {isAddModalOpen ? <Plus size={20} style={{ color: secondaryCyan }} /> : <Edit size={20} style={{ color: secondaryCyan }} />}
                                {isAddModalOpen ? 'Register New User' : 'Edit User Profile'}
                            </h2>
                            <button 
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                            </div>

                            {isAddModalOpen && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                    <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Designation</label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                                    <select name="roleId" required value={formData.roleId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all bg-white appearance-none">
                                        <option value="" disabled>Select Role</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Agency <span className="text-red-500">*</span></label>
                                    <select name="agencyId" required value={formData.agencyId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all bg-white appearance-none">
                                        <option value="" disabled>Select Agency</option>
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: secondaryCyan }}>
                                    {isAddModalOpen ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManageUsers;
