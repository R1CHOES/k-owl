import React, { useState, useEffect } from 'react';
import MarkdownTableEditor from '../components/MarkdownTableEditor';
import { FileText, CheckCircle, Clock, Loader2, X, ClipboardCheck, Eye, Link as LinkIcon, Sparkles, Download, Edit, Save, AlertCircle, Search } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const QAApprovals = () => {
    const navigate = useNavigate();
    // Data State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectDoc, setRejectDoc] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // 10 rows for table
    
    // Table states
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [selectedPair, setSelectedPair] = useState(null);
    const [editingContent, setEditingContent] = useState(null);
    const [aiMetadataForm, setAiMetadataForm] = useState({});
    const [aiDescriptionTextForm, setAiDescriptionTextForm] = useState("");

    const secondaryCyan = '#11B4D4';

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
            const globalRoles = ['superadmin', 'kbm', 'knowledge_base_manager'];

            if (!globalRoles.includes(currentUserRole)) {
                // strictly lock the data to their specific agency ID.
                securedDocs = securedDocs.filter(doc => doc.agencyId === currentUserAgencyId);
            }

            // 3. QA / Content Approver Status Filtering
            let pendingDocs = [];
            if (currentUserRole === 'content_approver' || currentUserRole === 'content-approver') {
                pendingDocs = securedDocs.filter(doc => doc.status === 'PENDING_APPROVAL');
            } else if (currentUserRole === 'qa' || currentUserRole === 'qa-reviewer') {
                pendingDocs = securedDocs.filter(doc => doc.status === 'IN_QA');
            } else if (globalRoles.includes(currentUserRole)) {
                pendingDocs = securedDocs.filter(doc => doc.status === 'IN_QA' || doc.status === 'PENDING_APPROVAL');
            }

            // 4. Set final state
            setDocuments(pendingDocs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load QA documents.' });
            setLoading(false);
        }
    };

    
    const handleRejectClick = (doc) => {
        setRejectDoc(doc);
        setRejectReason("");
        setIsRejectModalOpen(true);
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'Please provide a reason.'});
            return;
        }
        try {
            await api.post(`/api/documents/${rejectDoc.id}/reviews`, {
                stage: isCA ? 'CONTENT_APPROVAL' : 'QA',
                decision: 'REJECTED',
                remark: rejectReason
            });
            await fetchData();
            Swal.fire({ icon: 'success', title: 'Document Rejected', text: 'The focal person has been notified.', confirmButtonColor: '#11B4D4' });
            setIsRejectModalOpen(false);
            if (currentItems.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not reject the document.' });
        }
    };

    const handleApprove = async (doc) => {
        try {
            await api.post(`/api/documents/${doc.id}/reviews`, {
                stage: isCA ? 'CONTENT_APPROVAL' : 'QA',
                decision: isCA ? 'APPROVED' : 'PENDING_APPROVAL',
                remark: 'Approved without remarks.'
            });
            await fetchData();
            Swal.fire({ icon: 'success', title: isCA ? 'Published' : 'Approved', confirmButtonColor: '#11B4D4', timer: 1500, showConfirmButton: false });
            if (currentItems.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not approve the document.' });
        }
    };


    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_EXTRACTION': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider">⚙️ AI Processing...</span>;
            case 'IN_QA': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-bold uppercase tracking-wider">🟡 QA Review</span>;
            case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold uppercase tracking-wider">🟣 Needs Final Approval</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">✅ Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase tracking-wider">❌ Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-[#11B4D4]/10 text-[#11B4D4] rounded-full text-[10px] font-bold uppercase tracking-wider">Published</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Draft</span>;
            default: return <span className="inline-flex items-center gap-1 px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedDocIds(currentItems.map(d => d.id));
        else setSelectedDocIds([]);
    };
    
    const handleSelect = (id) => {
        setSelectedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    
    const handleBulkApprove = async () => {
        try {
            for (const id of selectedDocIds) {
                await api.post(`/api/documents/${id}/reviews`, {
                    stage: isCA ? 'CONTENT_APPROVAL' : 'QA',
                    decision: isCA ? 'APPROVED' : 'PENDING_APPROVAL',
                    remark: 'Bulk Approved.'
                });
            }
            await fetchData();
            setSelectedDocIds([]);
            Swal.fire({ icon: 'success', title: 'Bulk Approved', timer: 1500, showConfirmButton: false });
            if (currentItems.length === selectedDocIds.length && currentPage > 1) setCurrentPage(prev => prev - 1);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Some documents failed to approve.' });
        }
    };

    const handleBulkReject = () => {
        Swal.fire({
            title: 'Reject Selected Documents',
            text: 'Reason for rejecting these documents:',
            input: 'textarea',
            showCancelButton: true,
            confirmButtonText: 'Reject All',
            confirmButtonColor: '#ef4444'
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    for (const id of selectedDocIds) {
                        await api.post(`/api/documents/${id}/reviews`, {
                            stage: isCA ? 'CONTENT_APPROVAL' : 'QA',
                            decision: 'REJECTED',
                            remark: result.value
                        });
                    }
                    await fetchData();
                    setSelectedDocIds([]);
                    Swal.fire({ icon: 'success', title: 'Bulk Rejected' });
                    if (currentItems.length === selectedDocIds.length && currentPage > 1) setCurrentPage(prev => prev - 1);
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Bulk reject failed.' });
                }
            }
        });
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

    const formatCamelToTitle = (text) => {
        const result = text.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const handleEditDataClick = (doc) => {
        setEditingContent(doc);
        const dynamicMetadata = doc.versions?.[0]?.content?.dynamicMetadata || {};
        const metadata = dynamicMetadata["Document Info"] || dynamicMetadata || {};
        setAiMetadataForm(JSON.parse(JSON.stringify(metadata)));
        setAiDescriptionTextForm(doc.versions?.[0]?.content?.descriptionText || "");
    };

    const handleFieldChange = (key, newValue) => {
        setAiMetadataForm(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    const handleSaveData = async () => {
        try {
            const dataToSave = { ...aiMetadataForm };
            
            const contentId = editingContent.versions[0].content.id;
            const fullMetadata = editingContent.versions[0].content.dynamicMetadata || {};
            fullMetadata["Document Info"] = dataToSave;

            await api.patch(`/api/content/${contentId}/metadata`, { 
                dynamicMetadata: fullMetadata,
                descriptionText: aiDescriptionTextForm
            });
            Swal.fire({ icon: 'success', title: 'Data Updated', confirmButtonColor: secondaryCyan });
            setEditingContent(null);
            fetchData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || err.message });
        }
    };

    const filteredDocuments = documents.filter(doc => {
        if (!searchTerm) return true;
        const title = doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || '';
        const username = doc.versions?.[0]?.uploader?.username || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) || username.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

    const userRole = localStorage.getItem('role') || '';
    const isCA = userRole === 'content_approver' || userRole === 'content-approver';

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900 flex items-center gap-4">
                    <ClipboardCheck className="text-[#11B4D4] w-8 h-8" /> 
                    {isCA ? 'Content Approvals' : 'QA & Approvals'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {isCA ? 'Review QA-approved documents and publish them to the system.' : 'Review pending documents and approve them for publishing.'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#11B4D4]" size={48} /></div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 mt-8">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">All caught up!</h2>
                    <p className="text-slate-500 text-center max-w-md">
                        There are currently no documents waiting for QA review. Great job keeping the inbox clean!
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-6 mt-8 w-full animate-fade-in">
                        {/* BULK ACTIONS HEADER */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button 
                                    onClick={handleBulkApprove} 
                                    disabled={selectedDocIds.length === 0}
                                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors shadow-sm"
                                >
                                    <CheckCircle size={16} className="inline mr-2"/> Approve Selected
                                </button>
                                <button 
                                    onClick={handleBulkReject} 
                                    disabled={selectedDocIds.length === 0}
                                    className="px-4 py-2 bg-white border border-rose-500 text-rose-500 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 transition-colors"
                                >
                                    <X size={16} className="inline mr-2"/> Reject Selected
                                </button>
                            </div>
                            <div className="relative w-full md:w-64">
                                <input 
                                    type="text" 
                                    placeholder="Search documents..." 
                                    value={searchTerm}
                                    onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                />
                                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>

                        {/* DATA TABLE */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedDocIds.length > 0 && selectedDocIds.length === currentItems.length} 
                                                    onChange={handleSelectAll} 
                                                    className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer" 
                                                />
                                            </th>
                                            <th className="px-6 py-4">Document Title</th>
                                            <th className="px-6 py-4">Uploaded By</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentItems.map(doc => (
                                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedDocIds.includes(doc.id)} 
                                                        onChange={() => handleSelect(doc.id)} 
                                                        className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer" 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={20} className="text-[#11B4D4]" />
                                                        <div>
                                                            <p className="font-bold text-[#123971]">{doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-400">{(doc.versions?.[0]?.fileSizeBytes ? (doc.versions[0].fileSizeBytes / 1024 / 1024).toFixed(2) : 0)} MB</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{doc.versions?.[0]?.uploader?.username || 'System'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="relative inline-block text-left group/dropdown">
                                                        <button 
                                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 peer"
                                                        >
                                                            Actions ▼
                                                        </button>
                                                        
                                                        {/* CSS-Only Dropdown */}
                                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all z-20 flex flex-col overflow-hidden">
                                                            <button onMouseDown={() => setSelectedPair(doc)} className="px-4 py-2.5 text-left hover:bg-cyan-50 text-slate-700 font-semibold text-sm flex items-center gap-3 transition-colors"><Eye size={16} className="text-cyan-500"/> View</button>
                                                            <button onMouseDown={() => handleEditDataClick(doc)} className="px-4 py-2.5 text-left hover:bg-purple-50 text-slate-700 font-semibold text-sm flex items-center gap-3 transition-colors"><Edit size={16} className="text-purple-500"/> Quick Fix</button>
                                                            <button onMouseDown={() => handleRejectClick(doc)} className="px-4 py-2.5 text-left hover:bg-rose-50 text-rose-600 font-semibold text-sm flex items-center gap-3 transition-colors"><X size={16} className="text-rose-500"/> Reject</button>
                                                            <button onMouseDown={() => handleApprove(doc)} className="px-4 py-2.5 text-left hover:bg-emerald-50 text-emerald-600 font-semibold text-sm flex items-center gap-3 transition-colors border-t border-slate-100"><CheckCircle size={16} className="text-emerald-500"/> Approve</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div> {/* <--- THIS CLOSES THE MAIN TABLE WRAPPER! */}

                        {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
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
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - Split View */}
                        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-gray-100">
                            {/* Left: Original Upload */}
                            <div className="p-4 flex flex-col border-r border-gray-200">
                                <div className="mb-4 flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <FileText size={16} className="text-cyan-500" /> Original Uploaded PDF
                                    </h3>
                                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded truncate max-w-[200px]">
                                        {selectedPair.versions?.[0]?.filename}
                                    </span>
                                </div>
                                <iframe
                                    src={selectedPair.versions?.[0]?.filePath ? ('http://localhost:3000/uploads/' + selectedPair.versions[0].filePath.split('\\').pop().split('/').pop()) : ''}
                                    className="w-full flex-1 min-h-[60vh] h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white"
                                    title="Original PDF"
                                ></iframe>
                            </div>

                            {/* Right: AI Generated Report */}
                            <div className="p-4 flex flex-col">
                                <div className="mb-4 flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-500" /> AI Organized Report
                                    </h3>
                                    <a
                                        href={getReportUrl(selectedPair)}
                                        download={getReportFileName(selectedPair)}
                                        className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-1 rounded transition-colors flex items-center gap-1"
                                    >
                                        <Download size={16} /> Download
                                    </a>
                                </div>
                                <iframe
                                    src={getReportUrl(selectedPair)}
                                    className="w-full flex-1 min-h-[60vh] h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white"
                                    title="Generated PDF"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MANUAL DATA EDIT MODAL */}
            {editingContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">
                                    <Edit size={24} className="text-[#00AEEF]" /> Manual Data Editor
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Edit the AI-extracted metadata for this document</p>
                            </div>
                            <button
                                onClick={() => setEditingContent(null)}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors bg-white shadow-sm border border-gray-200"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-8">
                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg font-extrabold text-cyan-600 border-b-2 border-cyan-100 pb-2">
                                    Document Metadata
                                </h3>
                                {Object.keys(aiMetadataForm).length === 0 ? (
                                    <div className="text-sm text-gray-500">No metadata found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(aiMetadataForm).map(([fieldKey, fieldValue]) => (
                                            <div key={fieldKey} className="flex flex-col">
                                                <label className="text-sm font-bold text-gray-700 mb-1">
                                                    {formatCamelToTitle(fieldKey)}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fieldValue || ''}
                                                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                                                    className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-800 shadow-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg font-extrabold text-cyan-600 border-b-2 border-cyan-100 pb-2">
                                    Extracted Content Body
                                </h3>
                                <div className="flex flex-col">
                                    <label className="text-sm font-bold text-gray-700 mb-1">
                                        Body Text (Markdown supported)
                                    </label>
                                    <MarkdownTableEditor markdownText={aiDescriptionTextForm} setMarkdownText={setAiDescriptionTextForm} />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t border-gray-100 bg-white flex justify-end gap-4">
                            <button
                                onClick={() => setEditingContent(null)}
                                className="px-6 py-2 bg-white border-2 border-[#123971]/10 hover:border-[#123971]/30 hover:bg-slate-50 text-[#123971] font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveData}
                                className="px-6 py-2 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                style={{ backgroundColor: '#00AEEF' }}
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
{/* REJECT MODAL */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <AlertCircle className="text-rose-500" /> Reject Document
                            </h2>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                            <textarea 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none resize-none"
                                placeholder="Explain why this document needs revision..."
                            ></textarea>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={submitReject} className="px-4 py-2 font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 shadow-sm transition-colors">Submit Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QAApprovals;
