import React, { useState } from 'react';
import { Search, Plus, User, Mail, Briefcase, Building, Edit, UserX } from 'lucide-react';

const dummyUsers = [
    {
        id: 1,
        username: 'juan.delacruz',
        email: 'jdelacruz@stii.dost.gov.ph',
        designation: 'Senior Research Specialist',
        roleSlug: 'agency-focal-person',
        agencyName: 'STII',
        isActive: true
    },
    {
        id: 2,
        username: 'maria.santos',
        email: 'msantos@pchrd.dost.gov.ph',
        designation: 'QA Head',
        roleSlug: 'qa-reviewer',
        agencyName: 'PCHRD',
        isActive: true
    },
    {
        id: 3,
        username: 'carlos.reyes',
        email: 'creyes@fnri.dost.gov.ph',
        designation: 'Content Writer',
        roleSlug: 'content-approver',
        agencyName: 'FNRI',
        isActive: false
    },
    {
        id: 4, username: 'anna.lim', email: 'alim@stii.dost.gov.ph', designation: 'Research Assistant', roleSlug: 'knowledge-base-manager', agencyName: 'STII', isActive: true
    },
    {
        id: 5, username: 'peter.parker', email: 'pparker@fnri.dost.gov.ph', designation: 'Photographer', roleSlug: 'agency-focal-person', agencyName: 'FNRI', isActive: true
    },
    {
        id: 6, username: 'diana.prince', email: 'dprince@pchrd.dost.gov.ph', designation: 'Project Manager', roleSlug: 'qa-reviewer', agencyName: 'PCHRD', isActive: true
    },
    {
        id: 7, username: 'bruce.wayne', email: 'bwayne@stii.dost.gov.ph', designation: 'Director', roleSlug: 'super-admin', agencyName: 'STII', isActive: false
    },
    {
        id: 8, username: 'clark.kent', email: 'ckent@stii.dost.gov.ph', designation: 'Journalist', roleSlug: 'content-approver', agencyName: 'STII', isActive: true
    },
    {
        id: 9, username: 'barry.allen', email: 'ballen@pchrd.dost.gov.ph', designation: 'Analyst', roleSlug: 'agency-focal-person', agencyName: 'PCHRD', isActive: true
    },
    {
        id: 10, username: 'hal.jordan', email: 'hjordan@fnri.dost.gov.ph', designation: 'Pilot', roleSlug: 'qa-reviewer', agencyName: 'FNRI', isActive: true
    },
    {
        id: 11, username: 'arthur.curry', email: 'acurry@stii.dost.gov.ph', designation: 'Marine Biologist', roleSlug: 'knowledge-base-manager', agencyName: 'STII', isActive: true
    },
    {
        id: 12, username: 'victor.stone', email: 'vstone@pchrd.dost.gov.ph', designation: 'IT Specialist', roleSlug: 'agency-focal-person', agencyName: 'PCHRD', isActive: true
    }
];

const ManageUsers = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    // Pagination logic
    const usersPerPage = 5;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = dummyUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(dummyUsers.length / usersPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
            
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
                            <div className="absolute top-6 right-6 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                <div className={`w-2.5 h-2.5 rounded-full ${selectedUser.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                                <span className={`text-xs font-bold ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
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
                                {selectedUser.roleSlug.replace(/-/g, ' ')}
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
                                            <span className="font-bold">{selectedUser.designation}</span>
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
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm">
                                <Edit size={16} /> Edit Profile
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-100 hover:border-red-300 transition-all">
                                <UserX size={16} /> Deactivate
                            </button>
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
                                placeholder="Search by name or email..." 
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:border-transparent transition-all font-medium text-sm"
                                style={{ '--tw-ring-color': secondaryCyan }}
                            />
                        </div>
                        <button 
                            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: secondaryCyan, boxShadow: `0 10px 20px -5px ${secondaryCyan}60` }}
                        >
                            <Plus size={18} strokeWidth={3} /> Add User
                        </button>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
                    {currentUsers.map(user => {
                        const isSelected = selectedUser?.id === user.id;
                        return (
                            <div 
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                                    isSelected 
                                    ? 'bg-[#11B4D4]/5 border-[#11B4D4] shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                                style={isSelected ? { borderLeftWidth: '4px', borderLeftColor: secondaryCyan } : { borderLeftWidth: '4px', borderLeftColor: 'transparent' }}
                            >
                                <div className="flex items-center gap-5">
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm transform transition-transform group-hover:scale-105" 
                                        style={{ backgroundColor: primaryNavy }}
                                    >
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base group-hover:text-[#11B4D4] transition-colors">{user.username}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    {/* Agency Badge */}
                                    <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold tracking-wider rounded-lg border border-gray-200">
                                        {user.agencyName}
                                    </div>
                                    
                                    {/* Chevron/Action Indicator */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-white text-[#11B4D4] shadow-sm' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-600'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, dummyUsers.length)} of {dummyUsers.length} users
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
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-colors ${currentPage === totalPages ? 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ManageUsers;
