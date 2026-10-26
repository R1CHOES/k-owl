import sys

def update_file():
    with open("src/pages/ManageDocuments.jsx", "r", encoding="utf-8") as f:
        content = f.read()
        
    lib_start = content.find("{/* LIBRARY TAB */}")
    con_start = content.find("{/* CONTENT TAB */}")
    pag_start = content.find("{/* PAGINATION CONTROLS */}")
    
    if lib_start == -1 or con_start == -1 or pag_start == -1:
        print("Could not find markers")
        return
        
    before_lib = content[:lib_start]
    after_pag = content[pag_start:]
    
    new_lib = """{/* LIBRARY TAB */}
                {activeTab === 'library' && (
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
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
"""

    new_con = """
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
                                                    <td className="px-6 py-4 text-right">
                                                        {!isPending && (
                                                            <button
                                                                onClick={() => handleEditDataClick(doc)}
                                                                className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors inline-flex"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        )}
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

"""

    with open("src/pages/ManageDocuments.jsx", "w", encoding="utf-8") as f:
        f.write(before_lib + new_lib + new_con + "\n" + after_pag)
        
    print("Done!")

update_file()
