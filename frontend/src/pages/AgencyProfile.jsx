import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, FileText, ArrowLeft, Loader2, Mail, Briefcase, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const AgencyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role') || 'superadmin';
    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        const fetchAgency = async () => {
            try {
                const res = await api.get(`/api/agencies/${id}`);
                setAgency(res.data);
            } catch (error) {
                console.error('Failed to fetch agency data', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error Loading Profile',
                    text: 'Could not fetch the agency profile data.',
                    confirmButtonColor: secondaryCyan
                }).then(() => navigate(`/${userRole}/agencies`));
            } finally {
                setLoading(false);
            }
        };
        fetchAgency();
    }, [id, navigate, userRole]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-slate-50">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-gray-500 font-medium">Loading agency profile...</p>
            </div>
        );
    }

    if (!agency) return null;

    const activeUsers = agency.users?.filter(u => u.isActive && u.status === 'APPROVED') || [];
    const totalDocs = agency.Document?.length || 0;

    return (
        <div className="bg-slate-50 min-h-full flex flex-col -m-8 p-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            
            {/* Header section with back button */}
            <div className="mb-6">
                <button 
                    onClick={() => navigate(`/${userRole}/agencies`)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-500 font-bold bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-colors w-max"
                >
                    <ArrowLeft size={16} /> Back to Agencies
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-[#123971] text-white flex items-center justify-center text-3xl font-black border-4 border-gray-50 shadow-md shrink-0 overflow-hidden">
                    {agency.logoUrl ? <img src={agency.logoUrl} alt={agency.name} className="w-full h-full object-cover bg-white" /> : agency.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">{agency.name}</h1>
                    <p className="text-gray-600 leading-relaxed max-w-3xl">
                        {agency.description || <span className="italic text-gray-400">No description provided for this agency.</span>}
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-5 border-l-4" style={{ borderLeftColor: secondaryCyan }}>
                    <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center">
                        <Users size={28} className="text-[#11B4D4]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Active Users</p>
                        <h3 className="text-3xl font-black text-gray-800">{activeUsers.length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-5 border-l-4" style={{ borderLeftColor: primaryNavy }}>
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                        <FileText size={28} className="text-[#123971]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Uploaded Documents</p>
                        <h3 className="text-3xl font-black text-gray-800">{totalDocs}</h3>
                    </div>
                </div>
            </div>

            {/* Mini-Tables Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                {/* Registered Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Users size={18} className="text-[#11B4D4]" /> Registered Users
                        </h3>
                    </div>
                    <div className="p-0 overflow-y-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agency.users?.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{user.username}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10} /> {user.email}</div>
                                            {user.designation && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Briefcase size={10} /> {user.designation}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-full ${user.isActive && user.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                    {user.isActive && user.status === 'APPROVED' ? 'ACTIVE' : (user.status || 'INACTIVE')}
                                                </span>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-cyan-500 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!agency.users || agency.users.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-500">No registered users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Documents Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FileText size={18} className="text-[#123971]" /> Recent Documents
                        </h3>
                    </div>
                    <div className="p-0 overflow-y-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Document Details</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agency.Document?.slice(0, 10).map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{doc.title || doc.fileName || doc.originalName || doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || 'Unknown File'}</div>
                                            <div className={`text-xs mt-0.5 line-clamp-1 ${!(doc.description || doc.versions?.[0]?.content?.descriptionText) ? 'italic text-gray-400' : 'text-gray-500'}`}>
                                                {doc.description || doc.versions?.[0]?.content?.descriptionText || 'No description'}
                                            </div>
                                            {doc.trackingId ? (
                                                <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Tracking ID: {doc.trackingId}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-full ${
                                                    doc.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                }`}>
                                                    {doc.status}
                                                </span>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#123971] transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!agency.Document || agency.Document.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-500">No documents found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AgencyProfile;
