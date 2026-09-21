import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, Loader2, X, ClipboardCheck, Eye, Link as LinkIcon, Sparkles, Download, Edit, Save } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const QAApprovals = () => {
    // Data State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9); // 3x3 grid

    // Modal states
    const [selectedPair, setSelectedPair] = useState(null);
    const [editingContent, setEditingContent] = useState(null);
    const [aiMetadataForm, setAiMetadataForm] = useState({});

    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const docsRes = await api.get('/api/documents');
            const pendingDocs = docsRes.data.filter(doc => doc.status === 'IN_QA');
            setDocuments(pendingDocs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load QA documents.' });
            setLoading(false);
        }
    };

    const updateDocumentStatus = async (id, newStatus) => {
        try {
            await api.patch(`/api/documents/${id}`, { status: newStatus });
            await fetchData();
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Document has been ${newStatus.toLowerCase()}.`,
                confirmButtonColor: secondaryCyan,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Adjust pagination if the current page becomes empty
            if (currentItems.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'An error occurred while updating status.', confirmButtonColor: secondaryCyan });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_EXTRACTION': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider">⚙️ AI Processing...</span>;
            case 'IN_QA': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-bold uppercase tracking-wider">🟡 Needs QA Review</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">✅ Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase tracking-wider">❌ Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#11B4D4]/10 text-[#11B4D4] rounded-full text-[10px] font-bold uppercase tracking-wider">Published</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Draft</span>;
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

    const formatCamelToTitle = (text) => {
        const result = text.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const handleEditDataClick = (doc) => {
        setEditingContent(doc);
        const metadata = doc.versions?.[0]?.content?.dynamicMetadata || {};
        setAiMetadataForm(JSON.parse(JSON.stringify(metadata)));
    };

    const handleFieldChange = (cluster, key, newValue) => {
        setAiMetadataForm(prev => ({
            ...prev,
            [cluster]: {
                ...prev[cluster],
                [key]: newValue
            }
        }));
    };

    const handleSaveData = async () => {
        try {
            const dataToSave = { ...aiMetadataForm };
            for (const cluster in dataToSave) {
                for (const key in dataToSave[cluster]) {
                    const val = dataToSave[cluster][key];
                    if (typeof val === 'string') {
                        try {
                            const parsed = JSON.parse(val);
                            if (typeof parsed === 'object' && parsed !== null) {
                                dataToSave[cluster][key] = parsed;
                            }
                        } catch (e) {
                            // Leave as string if not valid JSON object
                        }
                    }
                }
            }

            const contentId = editingContent.versions[0].content.id;
            await api.patch(`/api/content/${contentId}/metadata`, { dynamicMetadata: dataToSave });
            Swal.fire({ icon: 'success', title: 'Data Updated', confirmButtonColor: secondaryCyan });
            setEditingContent(null);
            fetchData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || err.message });
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = documents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(documents.length / itemsPerPage);

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <ClipboardCheck className="text-[#11B4D4]" size={32} /> 
                    QA & Approvals
                </h1>
                <p className="text-gray-500 mt-2">Review pending documents and approve them for publishing.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#11B4D4]" size={48} /></div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
                    <div className="w-24 h-24 bg-[#11B4D4]/10 rounded-full flex items-center justify-center mb-6">
                        <span className="text-5xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#123971] mb-2">All caught up!</h2>
                    <p className="text-gray-500 text-center max-w-md">
                        There are currently no documents waiting for QA review. Great job keeping the inbox clean!
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {currentItems.map(doc => (
                            <div
                                key={doc.id}
                                className="flex flex-col justify-between min-h-[160px] p-5 bg-white border border-gray-200 rounded-xl shadow-sm w-full"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="p-2.5 bg-yellow-50 rounded-xl transition-colors shrink-0">
                                            <FileText className="text-yellow-600" size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-bold text-[#123971] truncate">
                                                {doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || 'Unknown File'}
                                            </h4>
                                            <p className="text-sm text-gray-500 font-medium mt-1 truncate">
                                                {(doc.versions?.[0]?.fileSizeBytes ? (doc.versions[0].fileSizeBytes / 1024 / 1024).toFixed(2) : 0)} MB • {doc.versions?.[0]?.uploader?.username || 'System'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {getStatusBadge(doc.status)}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <Clock size={14} /> {new Date(doc.createdAt).toLocaleDateString()}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedPair(doc); }}
                                            className="p-2 text-cyan-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="View Organized PDF & Traceability"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditDataClick(doc); }}
                                            className="p-2 text-purple-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit AI Data"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        
                                        <div className="w-px h-5 bg-gray-300 mx-1"></div>
                                        
                                        <button
                                            onClick={() => updateDocumentStatus(doc.id, 'APPROVED')}
                                            className="p-2 text-emerald-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Approve"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => updateDocumentStatus(doc.id, 'REJECTED')}
                                            className="p-2 text-rose-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - Split View */}
                        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-gray-100">
                            {/* Left: Original Upload */}
                            <div className="p-4 flex flex-col border-r border-gray-200">
                                <div className="mb-3 flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <FileText size={18} className="text-cyan-500" /> Original Uploaded PDF
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
                                <div className="mb-3 flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Sparkles size={18} className="text-purple-500" /> AI Organized Report
                                    </h3>
                                    <a
                                        href={getReportUrl(selectedPair)}
                                        download={getReportFileName(selectedPair)}
                                        className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-1 rounded transition-colors flex items-center gap-1"
                                    >
                                        <Download size={14} /> Download
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
                                    <Edit size={20} className="text-[#00AEEF]" /> Manual Data Editor
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Edit the AI-extracted metadata for this document</p>
                            </div>
                            <button
                                onClick={() => setEditingContent(null)}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors bg-white shadow-sm border border-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - Dynamic Form */}
                        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-8">
                            {Object.keys(aiMetadataForm).length === 0 ? (
                                <div className="text-center text-gray-500 p-8">No AI metadata extracted yet.</div>
                            ) : (
                                Object.entries(aiMetadataForm).map(([clusterKey, clusterValue]) => (
                                    <div key={clusterKey} className="flex flex-col gap-5">
                                        <h3 className="text-lg font-extrabold text-cyan-600 border-b-2 border-cyan-100 pb-2">
                                            {formatCamelToTitle(clusterKey)}
                                        </h3>

                                        {typeof clusterValue === 'object' && clusterValue !== null ? (
                                            Object.entries(clusterValue).map(([fieldKey, fieldValue]) => {
                                                const displayValue = typeof fieldValue === 'object' && fieldValue !== null
                                                    ? JSON.stringify(fieldValue, null, 2)
                                                    : fieldValue || '';

                                                return (
                                                    <div key={fieldKey} className="flex flex-col">
                                                        <label className="text-sm font-bold text-gray-700 mb-1">
                                                            {formatCamelToTitle(fieldKey)}
                                                        </label>
                                                        <textarea
                                                            value={displayValue}
                                                            onChange={(e) => handleFieldChange(clusterKey, fieldKey, e.target.value)}
                                                            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-800 shadow-sm resize-y whitespace-pre-wrap"
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-sm text-gray-500">Invalid cluster format.</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button
                                onClick={() => setEditingContent(null)}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#123971] font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveData}
                                className="px-6 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                style={{ backgroundColor: '#00AEEF' }}
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QAApprovals;
