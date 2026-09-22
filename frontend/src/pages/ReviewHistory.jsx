import React, { useState, useEffect } from 'react';
import { History, FileText, Clock, Loader2, Eye, Link as LinkIcon, X } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const ReviewHistory = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPair, setSelectedPair] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const currentUserRole = localStorage.getItem('role') || '';
        const globalRoles = ['superadmin', 'super-admin', 'kbm', 'knowledge_base_manager', 'knowledge-base-manager'];
        const allowedRoles = ['qa', 'qa-reviewer', 'content_approver', 'content-approver', ...globalRoles];
        
        if (!allowedRoles.includes(currentUserRole)) {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const docsRes = await api.get('/api/documents');
            
            // 1. Safely retrieve auth context
            const currentUserRole = localStorage.getItem('role') || '';
            const rawAgencyId = localStorage.getItem('agencyId');
            const currentUserAgencyId = (rawAgencyId && rawAgencyId !== 'undefined') ? parseInt(rawAgencyId, 10) : null;

            // 2. The Bulletproof Scope Lock
            let securedDocs = docsRes.data;
            const globalRoles = ['superadmin', 'super-admin', 'kbm', 'knowledge_base_manager', 'knowledge-base-manager'];

            if (!globalRoles.includes(currentUserRole)) {
                // strictly lock the data to their specific agency ID.
                securedDocs = securedDocs.filter(doc => doc.agencyId === currentUserAgencyId);
            }

            // 3. Filter history docs based on role
            let historyDocs = securedDocs;
            
            if (currentUserRole === 'qa' || currentUserRole === 'qa-reviewer') {
                // QA sees what they passed to the next step, plus final outcomes
                historyDocs = historyDocs.filter(doc => ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(doc.status));
            } else if (currentUserRole === 'content_approver' || currentUserRole === 'content-approver') {
                // Approvers see the final outcomes
                historyDocs = historyDocs.filter(doc => ['APPROVED', 'REJECTED'].includes(doc.status));
            } else if (globalRoles.includes(currentUserRole)) {
                // Global roles see all historical outcomes
                historyDocs = historyDocs.filter(doc => ['APPROVED', 'REJECTED'].includes(doc.status));
            }

            setDocuments(historyDocs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load review history.' });
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold uppercase tracking-wider">🟣 Passed QA</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">✅ Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase tracking-wider">❌ Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#11B4D4]/10 text-[#11B4D4] rounded-full text-[10px] font-bold uppercase tracking-wider">Published</span>;
            default: return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
        }
    };

    const getReportFileName = (doc) => {
        if (!doc || !doc.versions || !doc.versions.length || !doc.versions[0].content) return 'document.pdf';
        const content = doc.versions[0].content;
        const versionNum = doc.versions[0].versionNumber || 1;
        const safeTitle = (content.title || 'Document').replace(/[<>:"/\\|?*]+/g, '').trim();
        return `${safeTitle}_Content_v${versionNum}.pdf`;
    };

    const getReportUrl = (doc) => {
        const fileName = getReportFileName(doc);
        return `http://localhost:3000/uploads/generated/${encodeURIComponent(fileName)}`;
    };

    const fileUrl = selectedPair?.versions?.[0] ? `http://localhost:3000/uploads/${selectedPair.versions[0].filePath.split('\\').pop().split('/').pop()}` : '';

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = documents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(documents.length / itemsPerPage);

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900 flex items-center gap-3">
                    <History className="text-[#11B4D4] w-8 h-8" /> 
                    Review History
                </h1>
                <p className="text-slate-500 mt-1">
                    A read-only log of documents you have processed.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#11B4D4]" size={48} /></div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 mt-8">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">No history yet</h2>
                    <p className="text-slate-500 text-center max-w-md">
                        Documents that you process will appear here for future reference.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            Processed Documents
                        </h3>
                    </div>
                    
                    <ul className="divide-y divide-slate-100">
                        {currentItems.map((doc, idx) => (
                            <li key={doc.id || idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#11B4D4] transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || 'Untitled Document'}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock size={12} /> Last Modified: {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                            <div className="text-xs text-slate-500">
                                                Uploader: {doc.versions?.[0]?.uploader?.username || 'System'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    {getStatusBadge(doc.status)}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedPair(doc); }}
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#11B4D4] transition-colors shadow-sm"
                                    >
                                        <Eye className="w-4 h-4" /> View PDF
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-center items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Previous
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center justify-center ${currentPage === i + 1
                                            ? 'bg-[#123971] text-white border-none'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TRACEABILITY LINK MODAL */}
            {selectedPair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-7xl flex flex-col overflow-hidden max-h-[95vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <LinkIcon size={24} className="text-cyan-500" /> Document Traceability Link
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Viewing original upload and AI generated report side-by-side</p>
                            </div>
                            <button
                                onClick={() => setSelectedPair(null)}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors bg-white shadow-sm border border-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Split View Content */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-100 min-h-[70vh]">
                            {/* Left Side: Original Document */}
                            <div className="flex-1 border-r border-gray-200 flex flex-col bg-white">
                                <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                                        <FileText size={16} className="text-gray-400" /> 
                                        Original Source ({selectedPair.versions?.[0]?.filename || 'Document'})
                                    </h3>
                                    <a 
                                        href={fileUrl} 
                                        download 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors"
                                    >
                                        Download Original
                                    </a>
                                </div>
                                <div className="flex-1 p-0 overflow-hidden bg-gray-50 relative">
                                    {fileUrl ? (
                                        <iframe
                                            src={fileUrl}
                                            className="w-full h-full border-0 absolute inset-0"
                                            title="Original Document PDF"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <FileText size={48} className="mb-2 opacity-50" />
                                            <p>Source file not available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Generated Content PDF */}
                            <div className="flex-1 flex flex-col bg-white">
                                <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
                                    <h3 className="font-bold text-purple-700 flex items-center gap-2 text-sm">
                                        <FileText size={16} /> 
                                        AI Organized Content
                                    </h3>
                                    <a 
                                        href={getReportUrl(selectedPair)} 
                                        download 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors"
                                    >
                                        Download AI Report
                                    </a>
                                </div>
                                <div className="flex-1 p-0 overflow-hidden bg-gray-50 relative">
                                    <iframe
                                        src={getReportUrl(selectedPair)}
                                        className="w-full h-full border-0 absolute inset-0"
                                        title="Generated Content PDF"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReviewHistory;
