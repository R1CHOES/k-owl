import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, Eye, X, UploadCloud, User, UserCheck, ShieldCheck, Download, Sparkles } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const DocumentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role') || 'superadmin';
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewTitle, setPreviewTitle] = useState('');

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const res = await api.get(`/api/documents/${id}`);
                setDoc(res.data);
            } catch (error) {
                console.error('Failed to fetch document', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error Loading Document',
                    text: 'Could not fetch the document timeline.',
                    confirmButtonColor: secondaryCyan
                }).then(() => navigate(`/${userRole}/documents`));
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [id, navigate, userRole]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-slate-50">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-gray-500 font-medium">Loading document traceability...</p>
            </div>
        );
    }

    if (!doc) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_EXTRACTION': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-100"><Loader2 size={12} className="animate-spin" /> Processing AI...</span>;
            case 'IN_QA': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100"><AlertCircle size={12} /> QA Review</span>;
            case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100"><AlertCircle size={12} /> Needs Final Approval</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100"><CheckCircle size={12} /> Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100"><X size={12} /> Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100"><Eye size={12} /> Published</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold border border-gray-200"><FileText size={12} /> Draft</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold border border-gray-200">{status}</span>;
        }
    };

    const latestDocVer = doc.versions?.[0];
    const latestContent = latestDocVer?.content;
    const documentTitle = latestContent?.title || latestDocVer?.filename || 'Untitled Document';

    // Build timeline events
    const timelineEvents = [];

    // 1. Upload Events
    doc.versions?.forEach(dv => {
        timelineEvents.push({
            id: `doc_upload_${dv.id}`,
            date: dv.createdAt,
            title: `Document Uploaded (Version ${dv.versionNumber})`,
            description: `File "${dv.filename}" was securely uploaded and hashed.`,
            icon: <UploadCloud size={16} className="text-white" />,
            bgColorCode: '#123971', // Navy
            actor: dv.uploader?.username || 'System',
            actionBtn: {
                label: 'View Original PDF',
                onClick: () => {
                    setPreviewUrl(`http://localhost:3000/uploads/${dv.filePath.split('\\').pop().split('/').pop()}`);
                    setPreviewTitle(dv.filename);
                }
            }
        });
        
        // 2. AI Extraction Events
        if (dv.content) {
            timelineEvents.push({
                id: `ai_extract_${dv.content.id}`,
                date: dv.content.createdAt,
                title: `AI Extraction Completed`,
                description: `Data successfully processed by K-OWL AI extraction engine.`,
                icon: <Sparkles size={16} className="text-white" />,
                bgColorCode: '#a855f7', // Purple 500
                actor: 'AI System',
                actionBtn: {
                    label: 'View AI Document',
                    onClick: () => {
                        const htmlContent = dv.content.descriptionText || 'No description found.';
                        Swal.fire({
                            title: 'AI Extracted Document',
                            html: `<div style="text-align: left; font-size: 14px; background: #fff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                                      ${htmlContent.replace(/\n/g, '<br/>')}
                                   </div>`,
                            width: '800px',
                            confirmButtonColor: secondaryCyan
                        });
                    }
                }
            });

            // 3. Human Content Version Edits
            dv.content.versions?.forEach(cv => {
                timelineEvents.push({
                    id: `content_edit_${cv.id}`,
                    date: cv.createdAt,
                    title: `Content Revised (Version ${cv.versionNumber})`,
                    description: `Extracted data was manually updated.`,
                    icon: <Edit size={16} className="text-white" />,
                    bgColorCode: '#06b6d4', // Cyan 500
                    actor: `Editor ID: ${cv.editorId}` // (If editor included, use editor.username)
                });
            });
        }
    });

    // 4. Final Approvals (Using the Document timestamps if available, else just a generic marker)
    if (doc.qaApprovedBy) {
        timelineEvents.push({
            id: 'qa_approval',
            date: doc.updatedAt, // Approximation since we don't track exact time of QA approval separately yet
            title: 'QA Review Approved',
            description: 'Document passed Quality Assurance.',
            icon: <UserCheck size={16} className="text-white" />,
            bgColorCode: '#eab308', // Yellow 500
            actor: doc.qaApprovedBy.username
        });
    }

    if (doc.contentApprovedBy) {
        timelineEvents.push({
            id: 'content_approval',
            date: doc.updatedAt,
            title: 'Final Content Approved',
            description: 'Document was approved by the Content Approver.',
            icon: <ShieldCheck size={16} className="text-white" />,
            bgColorCode: '#10b981', // Emerald 500
            actor: doc.contentApprovedBy.username
        });
    }

    if (doc.status === 'PUBLISHED') {
        timelineEvents.push({
            id: 'published',
            date: doc.updatedAt,
            title: 'Document Published',
            description: 'Document is now visible to the public or agency.',
            icon: <Eye size={16} className="text-white" />,
            bgColorCode: '#3b82f6', // Blue 500
            actor: 'System'
        });
    }

    // Sort events from oldest to newest (top to bottom)
    timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="bg-slate-50 min-h-full flex flex-col -m-8 p-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            
            {/* Header section with back button */}
            <div className="mb-6 flex justify-between items-center">
                <button 
                    onClick={() => navigate(`/${userRole}/documents`)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-500 font-bold bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Documents
                </button>
                {getStatusBadge(doc.status)}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <h1 className="text-3xl font-black text-[#123971] mb-2">{documentTitle}</h1>
                <p className="text-gray-500 font-medium">Tracking ID: {latestContent?.referenceCode || doc.id.toString().padStart(6, '0')} • Agency ID: {doc.agencyId}</p>
            </div>

            {/* Traceability Cards */}
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Accountability Chain</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <User size={20} className="text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Uploaded By</p>
                        <h3 className="text-lg font-bold text-gray-800 truncate" title={doc.uploadedBy?.username || doc.versions?.[0]?.uploader?.username || 'Unknown'}>{doc.uploadedBy?.username || doc.versions?.[0]?.uploader?.username || 'Unknown'}</h3>
                        <p className="text-xs text-slate-500 truncate">{doc.uploadedBy?.email || doc.versions?.[0]?.uploader?.email || '-'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100">
                        <UserCheck size={20} className="text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-yellow-600/60 uppercase tracking-wider mb-0.5">QA Approver</p>
                        <h3 className="text-lg font-bold text-gray-800 truncate" title={doc.qaApprovedBy?.username || 'Pending'}>{doc.qaApprovedBy?.username || 'Pending'}</h3>
                        <p className="text-xs text-slate-500 truncate">{doc.qaApprovedBy?.email || '-'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <ShieldCheck size={20} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-wider mb-0.5">Content Approver</p>
                        <h3 className="text-lg font-bold text-gray-800 truncate" title={doc.contentApprovedBy?.username || 'Pending'}>{doc.contentApprovedBy?.username || 'Pending'}</h3>
                        <p className="text-xs text-slate-500 truncate">{doc.contentApprovedBy?.email || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Version Timeline */}
            <h2 className="text-lg font-bold text-gray-800 mb-6 px-1">Document Timeline</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex-1">
                <div className="relative flex flex-col py-2" style={{ gap: '3rem' }}>
                    {/* The solid vertical line connecting the icons */}
                    <div className="absolute top-2 bottom-2 left-[15px] w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent z-0"></div>
                    
                    {timelineEvents.map((evt, idx) => (
                        <div key={evt.id} className="relative flex items-center z-10 group">
                            <div 
                                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white ring-4 ring-white transition-transform duration-300 group-hover:scale-110 z-10"
                                style={{ backgroundColor: evt.bgColorCode }}
                            >
                                {evt.icon}
                            </div>
                            
                            <div 
                                className="flex flex-col md:flex-row md:justify-between md:items-center w-full p-5 rounded-2xl transition-all duration-300 border border-transparent hover:border-cyan-400 hover:shadow-md hover:bg-slate-50 cursor-default"
                                style={{ marginLeft: '2rem' }}
                            >
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{evt.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{evt.description}</p>
                                    <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                            <User size={12} /> {evt.actor}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(evt.date).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {evt.actionBtn && (
                                    <button 
                                        onClick={evt.actionBtn.onClick}
                                        className="mt-4 md:mt-0 px-5 py-2.5 text-xs font-bold text-[#11B4D4] bg-[#11B4D4]/10 rounded-xl hover:bg-[#11B4D4]/20 transition-colors whitespace-nowrap shadow-sm hover:shadow active:scale-95"
                                    >
                                        {evt.actionBtn.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {timelineEvents.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No timeline events found for this document.</div>
                )}
            </div>

            {/* Inline PDF Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
                                <FileText size={20} className="text-[#11B4D4] flex-shrink-0" />
                                <span className="truncate">{previewTitle}</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <a
                                    href={previewUrl}
                                    download={previewTitle}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                                    style={{ backgroundColor: secondaryCyan }}
                                >
                                    <Download size={16} /> Download
                                </a>
                                <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors ml-2">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-100/50 flex-1 overflow-hidden flex flex-col">
                            <iframe src={previewUrl} className="w-full flex-1 min-h-[70vh] rounded-xl border border-gray-200 shadow-inner bg-white" title="PDF Preview"></iframe>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default DocumentDetails;
