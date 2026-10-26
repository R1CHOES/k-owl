import sys

def recreate():
    with open("src/pages/ManageDocuments.jsx", "r", encoding="utf-8") as f:
        content = f.read()

    # Find the top return
    header_start = content.find('<div>\n                <h1 className="text-3xl font-light')
    
    # We will replace everything from `header_start` to `{/* PAGINATION CONTROLS */}`
    tabs_start = content.find('{/* TAB HEADERS */}')
    pag_start = content.find('{/* PAGINATION CONTROLS */}')
    
    before = content[:header_start]
    after = content[pag_start:]

    new_ui = """<div className="flex justify-between items-start sm:items-center gap-4 mb-8">
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
            </div>

            {/* TAB HEADERS & FILTERS */}
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

            <div className="w-full animate-fade-in">
                {/* LIBRARY TAB */}
                {(activeTab === 'library' || activeTab === 'upload') && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Document Title</th>
                                        <th className="px-6 py-4">Agency</th>
                                        <th className="px-6 py-4">Uploaded</th>
                                        <th className="px-6 py-4">Uploaded By</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Options</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center p-8"><Loader2 className="animate-spin text-slate-500 mx-auto" size={24} /></td></tr>
                                    ) : currentItems.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-slate-500 p-8 font-medium">No documents found.</td></tr>
                                    ) : (
                                        currentItems.map(doc => (
                                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-[#123971] cursor-pointer hover:underline" onClick={() => setSelectedPair(doc)}>
                                                    {doc.versions?.[0]?.filename || 'Unknown File'}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-700">
                                                    {doc.agency?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-700">
                                                    {doc.versions?.[0]?.uploader?.username || doc.uploadedBy?.username || 'System'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doc.status === 'IN_QA' ? 'bg-amber-100 text-amber-700' : doc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-cyan-100 text-cyan-700'}`}>
                                                        {doc.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(doc); }}
                                                            className="px-3 py-1.5 text-xs font-bold text-[#123971] bg-slate-100 rounded hover:bg-slate-200 transition-colors flex items-center gap-2"
                                                            title="Upload New Version"
                                                        >
                                                            <UploadCloud size={14} /> New Version
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/${userRole}/documents/${doc.id}`); }}
                                                            className="px-3 py-1.5 text-xs font-bold text-[#11B4D4] bg-cyan-50 rounded hover:bg-cyan-100 transition-colors flex items-center gap-2"
                                                            title="View Timeline"
                                                        >
                                                            <Clock size={14} /> Timeline
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleArchive(doc.id); }}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                            title="Archive"
                                                        >
                                                            <Trash size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Title / Topic</th>
                                        <th className="px-6 py-4">Source Document</th>
                                        <th className="px-6 py-4">Extracted On</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Options</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center p-8"><Loader2 className="animate-spin text-slate-500 mx-auto" size={24} /></td></tr>
                                    ) : currentItems.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center text-slate-500 p-8 font-medium">No content found.</td></tr>
                                    ) : (
                                        currentItems.map(doc => {
                                            const content = doc.versions?.[0]?.content;
                                            const isPending = doc.status === 'PENDING_EXTRACTION' || !content?.dynamicMetadata;
                                            return (
                                                <tr key={`content-${doc.id}`} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#123971]">
                                                                {formatCleanTitle(content?.title || doc.versions?.[0]?.filename || 'AI Document')}
                                                            </span>
                                                            {!isPending && content?.keywords && (
                                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                                    {content.keywords.split(',').slice(0, 2).map((kw, i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">{kw.trim()}</span>
                                                                    ))}
                                                                    {content.keywords.split(',').length > 2 && <span className="text-[10px] text-slate-400 font-bold">+{content.keywords.split(',').length - 2}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-500 text-xs truncate max-w-[200px]">
                                                        {doc.versions?.[0]?.filename || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                                                        {new Date(content?.updatedAt || doc.updatedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isPending ? (
                                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 animate-pulse">
                                                                Processing...
                                                            </span>
                                                        ) : (
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doc.status === 'IN_QA' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {doc.status.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">
                                                            {!isPending && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEditDataClick(doc); }}
                                                                    className="px-3 py-1.5 text-xs font-bold text-[#11B4D4] bg-cyan-50 rounded hover:bg-cyan-100 transition-colors flex items-center gap-2"
                                                                    title="View/Edit Generated Content"
                                                                >
                                                                    <Sparkles size={14} /> View Content
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            """
    
    code = before + new_ui + after
    
    # 2. Add new states
    state_insert_pos = code.find('const [searchTerm, setSearchTerm]')
    new_states = """const [uploadStep, setUploadStep] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    """
    code = code[:state_insert_pos] + new_states + code[state_insert_pos:]
    
    # 3. Update filter logic
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

    # 4. Modify AI Editor Header to add Reference Source
    old_editor_header = """<h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">
                                <Sparkles size={24} className="text-[#11B4D4]" />
                                AI Content Editor
                            </h2>"""
    new_editor_header = """<div className="flex items-center justify-between w-full">
                                <h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">
                                    <Sparkles size={24} className="text-[#11B4D4]" />
                                    AI Content Editor
                                </h2>
                                <button
                                    onClick={() => setSelectedPair(editingContent)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors mr-10"
                                    title="View Original PDF Source"
                                >
                                    <FileText size={16} /> Reference Source
                                </button>
                            </div>"""
    
    code = code.replace(old_editor_header, new_editor_header)

    # 5. Append Wizard Modal
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

    end_div = code.rfind('        </div>\n    );\n};\n\nexport default ManageDocuments;')
    if end_div != -1:
        code = code[:end_div] + wizard_modal + code[end_div:]

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

recreate()
print("Recreated flawlessly!")
