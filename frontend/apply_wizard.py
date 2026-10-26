import sys

with open('src/pages/ManageDocuments.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add new state for the upload wizard
state_insert_pos = code.find('const [searchTerm, setSearchTerm]')
new_states = """const [uploadStep, setUploadStep] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    """
code = code[:state_insert_pos] + new_states + code[state_insert_pos:]

# 2. Update filtering logic to include Status
filter_start = code.find('const filteredDocuments = documents.filter')
filter_end = code.find('const indexOfLastItem = currentPage * itemsPerPage;')
old_filter = code[filter_start:filter_end]

new_filter = """const filteredDocuments = documents.filter(doc => {
        if (agencyId && doc.agencyId !== parseInt(agencyId)) return false;
        if (filterStatus && doc.status !== filterStatus) return false;
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const filenameMatch = doc.versions?.[0]?.filename?.toLowerCase().includes(searchLower);
        const contentMetadata = JSON.stringify(doc.versions?.[0]?.content?.dynamicMetadata || {}).toLowerCase();
        const metadataMatch = contentMetadata.includes(searchLower);
        const uploaderMatch = (doc.versions?.[0]?.uploader?.username || doc.uploadedBy?.username || '').toLowerCase().includes(searchLower);
        
        return filenameMatch || metadataMatch || uploaderMatch;
    });

    """
code = code.replace(old_filter, new_filter)

# 3. Add the Upload Document button to the top header
header_start = code.find('<div>\\n                <h1 className="text-3xl font-light')
header_end = code.find('            </div>\\n            \\n            {/* TAB HEADERS */}')
old_header = code[header_start:header_end]

new_header = """<div className="flex justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-[#123971]">Manage Documents</h1>
                    <p className="text-slate-500 mt-2">Upload, hash, and track source documents across agencies.</p>
                </div>
                <button
                    onClick={() => { setUploadStep(1); setIsUploadModalOpen(true); }}
                    className="px-6 py-3 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: '#11B4D4' }}
                >
                    <UploadCloud size={20} /> Upload New Document
                </button>
            </div>"""
code = code.replace(old_header, new_header)

# 4. Remove Upload Tab from headers and update Search/Filter bar
tabs_start = code.find('{/* TAB HEADERS */}')
tabs_end = code.find('{/* TAB CONTENTS */}')
old_tabs = code[tabs_start:tabs_end]

new_tabs = """{/* TAB HEADERS & FILTERS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 gap-4 mb-6">
                <div className="flex gap-6 overflow-x-auto w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`pb-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'library' || activeTab === 'upload' ? 'border-b-2 border-[#11B4D4] text-[#11B4D4]' : 'text-slate-500 hover:text-[#123971]'}`}
                    >
                        <div className="flex items-center gap-2"><FileText size={16} /> Document Library</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'content' ? 'border-b-2 border-[#11B4D4] text-[#11B4D4]' : 'text-slate-500 hover:text-[#123971]'}`}
                    >
                        <div className="flex items-center gap-2"><Sparkles size={16} /> Generated Contents</div>
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-4 w-full sm:w-auto pb-4 overflow-x-auto">
                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search files or metadata..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium"
                        />
                    </div>
                    {['superadmin', 'kbm', 'knowledge_base_manager'].includes(userRole) && (
                        <select
                            value={agencyId}
                            onChange={(e) => setAgencyId(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium text-slate-500 shrink-0"
                        >
                            <option value="">All Agencies</option>
                            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    )}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium text-slate-500 shrink-0"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="IN_QA">In QA Review</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="PENDING_EXTRACTION">Pending Processing</option>
                    </select>
                </div>
            </div>

            """
code = code.replace(old_tabs, new_tabs)

# 5. Remove the inline UPLOAD TAB and replace it with the Modal logic at the bottom
upload_tab_start = code.find('{/* UPLOAD TAB */}')
upload_tab_end = code.find('{/* LIBRARY TAB */}')
old_upload_tab = code[upload_tab_start:upload_tab_end]

code = code.replace(old_upload_tab, '')

# Append the Upload Wizard Modal at the very end before the closing </div> of the page
wizard_modal = """
            {/* UPLOAD WIZARD MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden relative">
                        {/* Stepper Header */}
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center relative">
                            <h2 className="text-2xl font-black text-[#123971] flex items-center gap-2">
                                <UploadCloud className="text-[#11B4D4]" size={28} /> Secure Upload Wizard
                            </h2>
                            <button onClick={() => !uploading && setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-center gap-4">
                            <div className={`flex items-center gap-2 font-bold text-sm ${uploadStep >= 1 ? 'text-[#11B4D4]' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${uploadStep >= 1 ? 'bg-[#11B4D4] text-white' : 'bg-slate-200 text-slate-500'}`}>1</span> Provide File
                            </div>
                            <div className={`w-12 h-0.5 ${uploadStep >= 2 ? 'bg-[#11B4D4]' : 'bg-slate-200'}`}></div>
                            <div className={`flex items-center gap-2 font-bold text-sm ${uploadStep >= 2 ? 'text-[#11B4D4]' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${uploadStep >= 2 ? 'bg-[#11B4D4] text-white' : 'bg-slate-200 text-slate-500'}`}>2</span> Processing
                            </div>
                            <div className={`w-12 h-0.5 ${uploadStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                            <div className={`flex items-center gap-2 font-bold text-sm ${uploadStep >= 3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${uploadStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span> Complete
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                            {uploadStep === 1 && (
                                <form onSubmit={(e) => { e.preventDefault(); setUploadStep(2); handleUpload(e); }} className="space-y-6 animate-fade-in">
                                    {['superadmin', 'kbm', 'knowledge_base_manager'].includes(userRole) && (
                                        <div>
                                            <label className="block text-sm font-bold text-[#123971] mb-2">Owning Agency <span className="text-red-500">*</span></label>
                                            <select
                                                value={agencyId}
                                                onChange={(e) => setAgencyId(e.target.value)}
                                                required
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11B4D4] transition-all text-sm font-medium"
                                            >
                                                <option value="">-- Select Agency --</option>
                                                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-[#123971] mb-2">Select File <span className="text-red-500">*</span></label>
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-[#11B4D4] bg-[#11B4D4]/5' : 'border-slate-300 hover:border-[#11B4D4] hover:bg-slate-50'}`}
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
                                                    <p className="font-bold text-[#123971] text-lg">{file.name}</p>
                                                    <p className="text-sm text-slate-500 font-medium mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    <p className="text-xs text-[#11B4D4] font-bold mt-4 bg-white px-4 py-2 rounded-full border border-[#11B4D4]/20 shadow-sm">Click to change file</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                                        <UploadCloud size={32} />
                                                    </div>
                                                    <p className="font-bold text-[#123971] text-lg">Browse or drag file here</p>
                                                    <p className="text-sm text-slate-500 font-medium mt-2">Supported: PDF, DOCX, TXT</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!file || !agencyId}
                                        className={`w-full py-4 text-white font-bold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 ${(!file || !agencyId) ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:-translate-y-0.5'}`}
                                        style={(!file || !agencyId) ? {} : { backgroundColor: '#11B4D4' }}
                                    >
                                        <UploadCloud size={20} /> Begin Upload Process
                                    </button>
                                </form>
                            )}

                            {uploadStep === 2 && (
                                <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                                    <Loader2 size={64} className="text-[#11B4D4] animate-spin mb-6" />
                                    <h3 className="text-2xl font-black text-[#123971] text-center mb-2">Processing Document...</h3>
                                    <p className="text-slate-500 font-medium text-center max-w-md">
                                        Securely uploading file and queuing for background AI processing. Please don't close this window.
                                    </p>
                                </div>
                            )}

                            {uploadStep === 3 && (
                                <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#123971] text-center mb-2">Upload Successful!</h3>
                                    <p className="text-slate-500 font-medium text-center max-w-md mb-8">
                                        Your document has been securely processed. It is now listed in the library and queued for AI extraction.
                                    </p>
                                    <button
                                        onClick={() => { setIsUploadModalOpen(false); setUploadStep(1); setActiveTab('library'); }}
                                        className="px-8 py-3 bg-[#123971] text-white font-bold rounded-xl shadow-sm hover:-translate-y-0.5 transition-all"
                                    >
                                        Return to Library
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
"""

end_div = code.rfind('        </div>\\n    );\\n};\\n\\nexport default ManageDocuments;')
if end_div != -1:
    code = code[:end_div] + wizard_modal + code[end_div:]

# Update handleUpload to not show swal but just move to step 3
handle_start = code.find('const performUpload = async')
handle_end = code.find('const handleFileChange')
old_handle = code[handle_start:handle_end]

new_handle = old_handle.replace("""Swal.fire({
                icon: 'success',
                title: 'Upload Successful',
                text: 'Your document has been securely uploaded and queued for background AI processing. You may close this tab.',
                confirmButtonColor: secondaryCyan
            });""", "setUploadStep(3);").replace("setIsUploadModalOpen(false);", "")

code = code.replace(old_handle, new_handle)

with open('src/pages/ManageDocuments.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
