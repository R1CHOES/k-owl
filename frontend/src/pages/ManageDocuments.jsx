import React, { useState, useEffect, useRef } from 'react';
import { FileText, UploadCloud, Link as LinkIcon, Building2, CheckCircle, Clock, AlertCircle, Loader2, Eye, Download, X, Edit, Sparkles, Archive } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const ManageDocuments = () => {
    // Form State
    const [file, setFile] = useState(null);
    const [agencyId, setAgencyId] = useState('');
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

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    const fileUrl = previewDoc?.versions?.[0] ? 'http://localhost:3000/uploads/' + previewDoc.versions[0].filePath.split('\\').pop().split('/').pop() : '';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [agenciesRes, docsRes] = await Promise.all([
                api.get('/api/agencies'),
                api.get('/api/documents')
            ]);
            setAgencies(agenciesRes.data);
            setDocuments(docsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load initial data.' });
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            return Swal.fire({ icon: 'warning', title: 'Missing File', text: 'Please select a document to upload.' });
        }
        if (!agencyId) {
            return Swal.fire({ icon: 'warning', title: 'Missing Agency', text: 'Please select an agency for this document.' });
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agencyId', agencyId);

        try {
            await api.post('/api/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // On success, reset form and prepend the new document to the list by refetching
            setFile(null);
            setAgencyId('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            await fetchData();

            Swal.fire({
                icon: 'success',
                title: 'Upload Successful',
                text: 'Your document has been securely uploaded and hashed.',
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

    const handleEditClick = (doc) => {
        setEditDoc(doc);
        setEditFormData({ agencyId: doc.agencyId, status: doc.status });
        setEditFile(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
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
        }
    };


    const handleArchive = async (doc) => {
        const result = await Swal.fire({
            title: 'Archive Document?',
            text: `Are you sure you want to archive "${doc.versions?.[0]?.filename || 'this document'}"? It will be hidden from the repository.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Yes, archive it!'
        });

        if (result.isConfirmed) {
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

    const getStatusBadge = (status) => {
        switch(status) {
            case 'PENDING_EXTRACTION': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">Pending Extraction</span>;
            case 'DRAFT': return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200">Draft</span>;
            case 'IN_QA': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">In QA Review</span>;
            case 'APPROVED': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Approved</span>;
            case 'PUBLISHED': return <span className="px-3 py-1 bg-[#11B4D4]/10 text-[#11B4D4] rounded-full text-xs font-bold border border-[#11B4D4]/20">Published</span>;
            case 'REJECTED': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">Rejected</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Manage Documents</h1>
                <p className="text-gray-500 mt-2">Upload, hash, and track source documents across agencies.</p>
            </div>

            {/* TOP HALF: Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <UploadCloud className="text-[#11B4D4]" size={24} /> Upload New Document
                </h2>

                <form onSubmit={handleUpload} className="space-y-6">
                    {/* File Selection Area */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-[#11B4D4] bg-[#11B4D4]/5' : 'border-gray-300 hover:border-[#11B4D4] hover:bg-gray-50'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.txt"
                        />
                        {file ? (
                            <div className="flex flex-col items-center text-center">
                                <FileText size={48} className="text-[#11B4D4] mb-3" />
                                <p className="font-bold text-gray-700 text-lg">{file.name}</p>
                                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p className="text-xs text-[#11B4D4] font-medium mt-4">Click to change file</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <UploadCloud size={48} className="text-gray-300 mb-3" />
                                <p className="font-bold text-gray-600 text-lg">Click to browse or drag file here</p>
                                <p className="text-sm text-gray-400 mt-1">Supports PDF, DOCX, TXT up to 50MB</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Agency Dropdown */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Building2 size={16} className="text-gray-400" /> Owning Agency <span className="text-red-500">*</span>
                            </label>
                            <select 
                                value={agencyId}
                                onChange={(e) => setAgencyId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all font-medium appearance-none"
                                required
                            >
                                <option value="" disabled>Select an Agency</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={uploading}
                            className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-transform flex items-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'}`}
                            style={{ backgroundColor: secondaryCyan, boxShadow: uploading ? 'none' : `0 10px 20px -5px ${secondaryCyan}60` }}
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>

            {/* BOTTOM HALF: Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Document Repository</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">All uploaded source files across the system</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                    ) : documents.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No documents have been uploaded yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Filename</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Agency</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Uploader</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {documents.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-gray-400 group-hover:text-[#11B4D4] transition-colors" size={20} />
                                                <div>
                                                    <p className="font-bold text-gray-800 truncate max-w-[250px]">{doc.versions?.[0]?.filename || 'No File'}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{doc.versions?.[0] ? (doc.versions[0].fileSizeBytes / 1024).toFixed(1) : 0} KB</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-medium text-gray-700">{doc.agency?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-medium text-gray-600">{doc.versions?.[0]?.uploader?.username || 'System'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                <Clock size={14} className="text-gray-400" />
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setPreviewDoc(doc)}
                                                className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors inline-flex"
                                                title="Preview Document"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(doc)}
                                                className="p-2 text-gray-400 hover:text-[#11B4D4] hover:bg-[#11B4D4]/10 rounded-full transition-colors inline-flex"
                                                title="Edit Document Metadata"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setOrganizedDoc(doc)}
                                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors inline-flex"
                                                title="View Organized PDF"
                                            >
                                                <Sparkles size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleArchive(doc)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors inline-flex"
                                                title="Archive Document"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
                                <FileText size={20} className="text-[#11B4D4] flex-shrink-0" />
                                <span className="truncate">{previewDoc.versions?.[0]?.filename || 'Preview'}</span>
                            </h2>
                            <div className="flex items-center gap-3">
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
                                    <X size={20} />
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
                                <Edit size={20} style={{ color: secondaryCyan }} />
                                Edit Document
                            </h2>
                            <button 
                                onClick={() => setEditDoc(null)}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X size={20} />
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
                                        onChange={(e) => setEditFormData({...editFormData, agencyId: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all"
                                    >
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Workflow Status</label>
                                    <select 
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
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

                        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button type="button" onClick={() => setEditDoc(null)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" form="editDocForm" className="flex-1 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: secondaryCyan }}>
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
                                <Sparkles size={20} className="text-purple-600 flex-shrink-0" />
                                <span className="truncate">Organized PDF: {organizedDoc.versions?.[0]?.filename || 'Report'}</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <a 
                                    href={`http://localhost:3000/uploads/generated/organized_${organizedDoc.versions?.[0]?.id}.pdf`}
                                    download={`organized_${organizedDoc.versions?.[0]?.filename || 'document.pdf'}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                                    style={{ backgroundColor: '#9333ea' }}
                                >
                                    <Download size={16} /> Download
                                </a>
                                <button 
                                    onClick={() => setOrganizedDoc(null)}
                                    className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors ml-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body - PDF Iframe */}
                        <div className="p-6 bg-gray-100/50 flex-1 overflow-hidden flex flex-col">
                            <iframe 
                                src={`http://localhost:3000/uploads/generated/organized_${organizedDoc.versions?.[0]?.id}.pdf`}
                                className="w-full flex-1 min-h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white"
                                title="Organized PDF Preview"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ManageDocuments;
