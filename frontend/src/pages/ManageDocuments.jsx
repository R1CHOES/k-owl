import React, { useState, useEffect, useRef } from 'react';
import MarkdownTableEditor from '../components/MarkdownTableEditor';
import { useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, Link as LinkIcon, Building2, CheckCircle, Clock, AlertCircle, Loader2, Eye, Download, X, Edit, Sparkles, Archive, Trash, Search, Save } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';


const ManageDocuments = () => {
    const formatCleanTitle = (title) => title ? title.replace(/\.(pdf|docx?|txt)$/i, '') : 'Unknown Document';
    const userRole = localStorage.getItem('role') || 'superadmin';
    const userAgencyId = localStorage.getItem('agencyId');
    const navigate = useNavigate();

    // Form State
    const [file, setFile] = useState(null);
    const [agencyId, setAgencyId] = useState((userRole === 'focal_person' || userRole === 'focal' || userRole === 'agency-focal-person') ? userAgencyId : '');
    const fileInputRef = useRef(null);

    // Data State
    const [agencies, setAgencies] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [previewDoc, setPreviewDoc] = useState(null);
    const [editDoc, setEditDoc] = useState(null);
    const [editFormData, setEditFormData] = useState({ agencyId: '', status: '' });
    const [editFile, setEditFile] = useState(null);
    const editFileInputRef = useRef(null);
    const [organizedDoc, setOrganizedDoc] = useState(null);
    const [selectedPair, setSelectedPair] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingContent, setEditingContent] = useState(null);
    const [aiMetadataForm, setAiMetadataForm] = useState({});
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('library');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    const fileUrl = previewDoc?.versions?.[0] ? 'http://localhost:3000/uploads/' + previewDoc.versions[0].filePath.split('\\').pop().split('/').pop() : '';

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            const [agenciesRes, docsRes] = await Promise.all([
                api.get('/api/agencies'),
                api.get('/api/documents')
            ]);
            
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
            
            setAgencies(agenciesRes.data);
            setDocuments(securedDocs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load initial data.' });
            setLoading(false);
        }
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (file && agencyId) {
            performUpload(file, agencyId);
        } else if (!agencyId) {
            Swal.fire({ icon: 'warning', title: 'Missing Agency', text: 'Please select an agency first.' });
        }
    };

    const performUpload = async (fileToUpload, targetAgencyId) => {
        setUploading(true);

        const formData = new FormData();
        formData.append('agencyId', targetAgencyId);
        formData.append('file', fileToUpload);

        try {
            await api.post('/api/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setIsUploadModalOpen(false);
            await fetchData();

            Swal.fire({
                icon: 'success',
                title: 'Upload Successful',
                text: 'Your document has been securely uploaded and queued for background AI processing. You may close this tab.',
                confirmButtonColor: secondaryCyan
            });

        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.response?.data?.error || 'An error occurred during upload.',
                confirmButtonColor: secondaryCyan
            });
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleEditClick = (doc) => {
        setEditDoc(doc);
        setEditFormData({ agencyId: doc.agencyId, status: doc.status });
        setEditFile(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        formData.append('agencyId', editFormData.agencyId);
        formData.append('status', editFormData.status);
        if (editFile) {
            formData.append('file', editFile);
        }

        try {
            await api.patch(`/api/documents/${editDoc.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEditDoc(null);
            setEditFile(null);
            await fetchData();
            Swal.fire({
                icon: 'success',
                title: 'Document Updated',
                text: 'The document has been successfully updated.',
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            console.error("Update error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.response?.data?.error || 'An error occurred during update.',
                confirmButtonColor: secondaryCyan
            });
        } finally {
            setUploading(false);
        }
    };


    const handleArchive = async (doc) => {
        const confirmed = window.confirm("Are you sure you want to delete this document?");
        if (confirmed) {
            try {
                await api.patch(`/api/documents/${doc.id}/archive`);
                await fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'Archived!',
                    text: 'The document has been archived.',
                    confirmButtonColor: secondaryCyan
                });
            } catch (error) {
                console.error('Error archiving document:', error);
                Swal.fire({ icon: 'error', title: 'Archive Failed', text: 'An error occurred while archiving the document.', confirmButtonColor: secondaryCyan });
            }
        }
    };

    const formatCamelToTitle = (text) => {
        const result = text.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const [aiDescriptionTextForm, setAiDescriptionTextForm] = useState("");

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


    const handleResubmit = async (doc) => {
        try {
            await api.patch(`/api/documents/${doc.id}`, { status: 'IN_QA' });
            await fetchData();
            Swal.fire({ icon: 'success', title: 'Resubmitted to QA', text: 'The QA team has been notified.', confirmButtonColor: '#11B4D4' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not resubmit document.' });
        }
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

    const updateDocumentStatus = async (id, newStatus) => {
        try {
            await api.patch(`/api/documents/${id}`, { status: newStatus });
            await fetchData();
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Document status changed to ${newStatus}`,
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'An error occurred while updating status.', confirmButtonColor: secondaryCyan });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_EXTRACTION': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-100 shadow-sm animate-pulse"><Loader2 size={12} className="animate-spin" /> Processing AI...</span>;
            case 'IN_QA': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100 shadow-sm"><AlertCircle size={12} /> QA Review</span>;
            case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100 shadow-sm"><AlertCircle size={12} /> Needs Final Approval</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 shadow-sm"><CheckCircle size={12} /> Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100 shadow-sm"><X size={12} /> Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 shadow-sm"><Eye size={12} /> Published</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-2 px-4 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold border border-gray-200 shadow-sm"><FileText size={12} /> Draft</span>;
            default: return <span className="inline-flex items-center gap-2 px-4 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold border border-gray-200 shadow-sm">{status}</span>;
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

    const filteredDocuments = documents.filter(doc => {
        if (agencyId && doc.agencyId !== parseInt(agencyId)) return false;
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const filenameMatch = doc.versions?.[0]?.filename?.toLowerCase().includes(searchLower);
        const contentMetadata = JSON.stringify(doc.versions?.[0]?.content?.dynamicMetadata || {}).toLowerCase();
        const metadataMatch = contentMetadata.includes(searchLower);
        return filenameMatch || metadataMatch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-slate-900">Manage Documents</h1>
                <p className="text-slate-500 mt-1">Upload, hash, and track source documents across agencies.</p>
            </div>
            
            {/* TAB HEADERS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 gap-4 mb-6">
                <div className="flex gap-6 overflow-x-auto w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`pb-3 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'upload' ? 'border-b-2 border-[#11B4D4] text-[#11B4D4]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><UploadCloud size={16} /> Upload Document</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`pb-3 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'library' ? 'border-b-2 border-[#11B4D4] text-[#11B4D4]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><FileText size={16} /> Document Library</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-3 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'content' ? 'border-b-2 border-[#11B4D4] text-[#11B4D4]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><Sparkles size={16} /> Generated Contents</div>
                    </button>
                </div>

                {/* Search Bar - only show if not uploading */}
                {activeTab !== 'upload' && (
                    <div className="flex gap-4 w-full sm:w-auto pb-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium"
                            />
                        </div>
                        {['superadmin', 'kbm', 'knowledge_base_manager'].includes(userRole) && (
                            <select
                                value={agencyId}
                                onChange={(e) => setAgencyId(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium text-slate-600"
                            >
                                <option value="">All Agencies</option>
                                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* TAB CONTENTS */}
            <div className="w-full animate-fade-in">
                
                {/* UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mt-8">
                        {uploading && (
                            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
                                <Loader2 size={48} className="text-[#11B4D4] animate-spin mb-4" />
                                <h3 className="text-xl font-bold text-[#123971] text-center px-4">
                                    Uploading & Queuing...
                                </h3>
                                <p className="text-gray-500 mt-2 font-medium text-center px-4">AI processing will continue in the background.</p>
                            </div>
                        )}
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><UploadCloud className="text-[#11B4D4]" /> Secure Document Upload</h2>
                            
                            <form id="uploadDocForm" onSubmit={handleUpload} className="space-y-6">
                                {/* Agency Select */}
                                {['superadmin', 'kbm', 'knowledge_base_manager'].includes(userRole) && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Owning Agency <span className="text-red-500">*</span></label>
                                        <select
                                            value={agencyId}
                                            onChange={(e) => setAgencyId(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all"
                                        >
                                            <option value="">-- Select Agency --</option>
                                            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* File Dropzone */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select File <span className="text-red-500">*</span></label>
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-[#11B4D4] bg-[#11B4D4]/5' : 'border-gray-300 hover:border-[#11B4D4] hover:bg-gray-50'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                                            }}
                                            className="hidden"
                                            required
                                            accept=".pdf,.doc,.docx,.txt"
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center text-center">
                                                <FileText size={48} className="text-[#11B4D4] mb-4" />
                                                <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                                                <p className="text-sm text-gray-500 font-medium mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <p className="text-xs text-[#11B4D4] font-bold mt-4 bg-white px-3 py-1 rounded-full border border-[#11B4D4]/20 shadow-sm">Click to change file</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <UploadCloud size={32} className="text-gray-400" />
                                                </div>
                                                <p className="font-bold text-gray-800 text-lg">Click to browse or drag file here</p>
                                                <p className="text-sm text-gray-500 font-medium mt-2">Supported formats: PDF, DOCX, TXT</p>
                                                <p className="text-xs text-gray-400 font-medium mt-1">(Max file size: 10MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!file || !agencyId || uploading}
                                    className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${(!file || !agencyId || uploading) ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:shadow-xl hover:-translate-y-0.5'}`}
                                    style={(!file || !agencyId || uploading) ? {} : { backgroundColor: '#00AEEF' }}
                                >
                                    <UploadCloud size={20} /> Upload & Process Document
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* LIBRARY TAB */}
                {activeTab === 'library' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="text-[#11B4D4] w-6 h-6" /> Uploaded Documents
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-full flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                            ) : currentItems.length === 0 ? (
                                <div className="col-span-full text-center text-gray-500 p-8">No documents found in library.</div>
                            ) : (
                                currentItems.map(doc => (
                                    <div
                                    key={doc.id}
                                    className="flex flex-col justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-cyan-400 hover:shadow-sm transition-all w-full group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4 w-full">
                                            <div className="p-2 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-colors shrink-0">
                                                <FileText className="text-cyan-500" size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-[#123971] truncate cursor-pointer hover:underline" onClick={() => setSelectedPair(doc)}>
                                                    {doc.versions?.[0]?.filename || 'Unknown File'}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                                                    {(doc.versions?.[0]?.fileSizeBytes ? (doc.versions[0].fileSizeBytes / 1024 / 1024).toFixed(2) : 0)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Traceability Details */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 mb-4 bg-slate-50 p-4 sm:p-2 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Agency</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={doc.agency?.name || '-'}>{doc.agency?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Uploaded By</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={doc.versions?.[0]?.uploader?.username || doc.uploadedBy?.username || 'System'}>
                                                @{doc.versions?.[0]?.uploader?.username || doc.uploadedBy?.username || 'System'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">QA By</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={doc.status === 'APPROVED' ? (doc.qaApprovedBy?.username || 'System') : (doc.qaApprovedBy?.username || '-')}>{doc.status === 'APPROVED' ? (doc.qaApprovedBy?.username || 'System') : (doc.qaApprovedBy?.username || '-')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Approved By</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={doc.status === 'APPROVED' ? (doc.contentApprovedBy?.username || 'System') : (doc.contentApprovedBy?.username || '-')}>{doc.status === 'APPROVED' ? (doc.contentApprovedBy?.username || 'System') : (doc.contentApprovedBy?.username || '-')}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-between items-center mt-auto border-t border-slate-100 pt-4 gap-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(doc.status)}
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(doc); }}
                                                className="px-4 py-2 text-xs font-bold text-[#123971] bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                                                title="Upload New Version"
                                            >
                                                <UploadCloud size={16} /> New Version
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/${userRole}/documents/${doc.id}`); }}
                                                className="px-4 py-2 text-xs font-bold text-[#11B4D4] bg-[#11B4D4]/10 rounded-lg hover:bg-[#11B4D4]/20 transition-colors"
                                            >
                                                View Timeline
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleArchive(doc); }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                                title="Archive Document"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-purple-500 w-6 h-6" /> Generated Contents
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-full flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                            ) : currentItems.length === 0 ? (
                                <div className="col-span-full text-center text-gray-500 p-8">No generated content found.</div>
                            ) : (
                                currentItems.map(doc => {
                                    const content = doc.versions?.[0]?.content;
                                    const isPending = doc.status === 'PENDING_EXTRACTION' || !content?.dynamicMetadata;
                                    return (
                                        <div
                                        key={`content-${doc.id}`}
                                        onClick={() => !isPending && handleEditDataClick(doc)}
                                        className={`flex flex-col justify-between min-h-[160px] p-4 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:shadow-sm ${isPending ? 'cursor-default opacity-80' : 'cursor-pointer'} transition-all w-full group relative`}
                                    >
                                        {!isPending && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditDataClick(doc); }}
                                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors z-10"
                                                title="Edit AI Data"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        <div className="flex items-start gap-4 w-full">
                                            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors shrink-0">
                                                <Sparkles className="text-purple-500" size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-8">
                                                <h4 className="text-lg font-bold text-[#123971] truncate">
                                                    {formatCleanTitle(content?.title || doc.versions?.[0]?.filename || 'AI Document')}
                                                </h4>
                                                {isPending ? (
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center gap-2 px-4 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-bold animate-pulse">
                                                            ⚙️ AI is organizing this document...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-600 mt-1 truncate">
                                                        {(content?.descriptionText && (content.descriptionText.includes('| ---') || content.descriptionText.trim().startsWith('|'))) ? 'Structured Data Table Generated' : (content?.descriptionText || 'Content generated.')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isPending && content?.keywords && (
                                            <div className="flex flex-wrap gap-2 mt-auto overflow-hidden h-6">
                                                {(typeof content.keywords === 'string' ? content.keywords.split(',') : (Array.isArray(content.keywords) ? content.keywords : [])).slice(0, 3).map((keyword, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold tracking-wide uppercase">
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {content.keywords.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-md text-[10px] font-bold">
                                                        +{content.keywords.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>


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

            {/* PREVIEW MODAL */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
                                <FileText size={24} className="text-[#11B4D4] flex-shrink-0" />
                                <span className="truncate">{previewDoc.versions?.[0]?.filename || 'Preview'}</span>
                            </h2>
                            <div className="flex items-center gap-4">
                                <a
                                    href={fileUrl}
                                    download={previewDoc.versions?.[0]?.filename || 'document'}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                                    style={{ backgroundColor: secondaryCyan }}
                                >
                                    <Download size={16} /> Download Full File
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors ml-2"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body - PDF Iframe */}
                        <div className="p-6 bg-gray-100/50 flex-1 overflow-hidden flex flex-col">
                            <iframe
                                src={fileUrl}
                                className="w-full flex-1 min-h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white"
                                title="Document Preview"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Edit size={24} style={{ color: secondaryCyan }} />
                                Edit Document
                            </h2>
                            <button
                                onClick={() => setEditDoc(null)}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="editDocForm" onSubmit={handleEditSubmit} className="space-y-6">

                                {/* Replace File Area */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Replace File <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${editFile ? 'border-[#11B4D4] bg-[#11B4D4]/5' : 'border-gray-300 hover:border-[#11B4D4] hover:bg-gray-50'}`}
                                        onClick={() => editFileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={editFileInputRef}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) setEditFile(e.target.files[0]);
                                            }}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt"
                                        />
                                        {editFile ? (
                                            <div className="flex flex-col items-center text-center">
                                                <FileText size={32} className="text-[#11B4D4] mb-2" />
                                                <p className="font-bold text-gray-700 text-sm truncate max-w-[250px]">{editFile.name}</p>
                                                <p className="text-xs text-[#11B4D4] font-medium mt-2">Click to change file</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <UploadCloud size={32} className="text-gray-400 mb-2" />
                                                <p className="font-bold text-gray-600 text-sm">Upload new file to replace</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Owning Agency</label>
                                    <select
                                        value={editFormData.agencyId}
                                        onChange={(e) => setEditFormData({ ...editFormData, agencyId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all"
                                    >
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Workflow Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all"
                                    >
                                        <option value="PENDING_EXTRACTION">Pending Extraction</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="IN_QA">In QA Review</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 flex gap-4">
                            <button type="button" onClick={() => setEditDoc(null)} className="flex-1 py-2 bg-white border-2 border-[#123971]/10 hover:border-[#123971]/30 hover:bg-slate-50 text-[#123971] font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" form="editDocForm" className="flex-1 py-2 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: secondaryCyan }}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORGANIZED PDF MODAL */}
            {organizedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
                                <Sparkles size={24} className="text-purple-600 flex-shrink-0" />
                                <span className="truncate">Organized PDF: {organizedDoc.versions?.[0]?.filename || 'Report'}</span>
                            </h2>
                            <div className="flex items-center gap-4">
                                <a
                                    href={getReportUrl(organizedDoc)}
                                    download={getReportFileName(organizedDoc)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                                    style={{ backgroundColor: '#9333ea' }}
                                >
                                    <Download size={16} /> Download
                                </a>
                                <button
                                    onClick={() => setOrganizedDoc(null)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors ml-2"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body - PDF Iframe */}
                        <div className="p-6 bg-gray-100/50 flex-1 overflow-hidden flex flex-col">
                            <iframe
                                src={getReportUrl(organizedDoc)}
                                className="w-full flex-1 min-h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white"
                                title="Organized PDF Preview"
                            ></iframe>
                        </div>
                    </div>
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
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - Split View */}
                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-gray-100">
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

            
        </div>
    );
};

export default ManageDocuments;
