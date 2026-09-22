import React, { useState, useEffect } from 'react';
import { Loader2, FileText, AlertCircle, CheckCircle, ArrowRight, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

const DashboardOverview = () => {
    const userRole = localStorage.getItem('role') || 'superadmin';
    const userAgencyId = localStorage.getItem('agencyId');
    
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('Admin');
    const navigate = useNavigate();

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';
    const dostYellow = '#F59E0B'; // Yellow-500
    const dostEmerald = '#10B981'; // Emerald-500

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = jwtDecode(token);
                if (decoded.username) {
                    setUsername(decoded.username);
                }
            }
        } catch (e) {
            console.error("Could not decode token");
        }

        const fetchDocuments = async () => {
            try {
                const res = await api.get('/api/documents');
                let docs = Array.isArray(res.data) ? res.data : (res.data.documents || []);
                
                // 1. Safely retrieve auth context
                const currentUserRole = localStorage.getItem('role') || '';
                const rawAgencyId = localStorage.getItem('agencyId');
                const currentUserAgencyId = (rawAgencyId && rawAgencyId !== 'undefined') ? parseInt(rawAgencyId, 10) : null;

                // 2. The Bulletproof Scope Lock
                let securedDocs = docs;
                const globalRoles = ['superadmin', 'super-admin', 'kbm', 'knowledge_base_manager', 'knowledge-base-manager'];

                if (!globalRoles.includes(currentUserRole)) {
                    // strictly lock the data to their specific agency ID.
                    securedDocs = securedDocs.filter(doc => doc.agencyId === currentUserAgencyId);
                }

                setDocuments(securedDocs);
            } catch (error) {
                console.error("Failed to fetch documents", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-gray-500 font-medium">Loading dashboard insights...</p>
            </div>
        );
    }

    const totalDocs = documents.length;
    const pendingDocs = documents.filter(d => d.status === 'IN_QA');
    const approvedDocs = documents.filter(d => d.status === 'APPROVED').length;
    const rejectedDocs = documents.filter(d => d.status === 'REJECTED').length;
    const urgentDocs = pendingDocs.slice(0, 5);

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900">Welcome back, <span className="font-bold text-[#123971]">{username}</span></h1>
                <p className="text-slate-500 mt-2">Here is a quick overview of your system's current status and activity.</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {(userRole === 'qa' || userRole === 'content_approver') ? (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Needs Your Review</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-500">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{pendingDocs.length}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recently Approved</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{approvedDocs}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Returned / Rejected</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-500">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{rejectedDocs}</h2>
                        </div>
                    </>
                ) : (userRole === 'focal_person' || userRole === 'focal' || userRole === 'agency-focal-person') ? (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Uploads</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-50 text-[#11B4D4]">
                                    <FileText size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{totalDocs}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Approval</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-500">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{pendingDocs.length}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Needs Revision</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-500">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{rejectedDocs}</h2>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Documents</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-50 text-[#11B4D4]">
                                    <FileText size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{totalDocs}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending QA</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-500">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{pendingDocs.length}</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between w-full">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approved & Ready</p>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-light tracking-tight text-slate-900">{approvedDocs}</h2>
                        </div>
                    </>
                )}

            </div>

            {/* Urgent: Pending QA Reviews */}
            {!(userRole === 'focal_person' || userRole === 'focal') && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                Urgent: Pending QA Reviews
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">Documents that need your immediate attention</p>
                        </div>
                    </div>
                
                    <div className="p-0">
                        {urgentDocs.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h4 className="text-base font-semibold text-slate-800">All caught up!</h4>
                                <p className="text-sm text-slate-500 mt-1">No documents are currently waiting for QA review.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {urgentDocs.map((doc, idx) => (
                                    <li key={doc.id || idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#11B4D4] transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800">{doc.title || doc.filename || 'Untitled Document'}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{doc.summary || 'Pending review'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/qa-approvals')}
                                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                        >
                                            Go to Inbox
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardOverview;
