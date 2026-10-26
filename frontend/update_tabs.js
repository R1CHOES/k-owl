const fs = require('fs');

let content = fs.readFileSync('src/pages/ManageDocuments.jsx', 'utf8');

const libStart = content.indexOf('{/* LIBRARY TAB */}');
const contentStart = content.indexOf('{/* CONTENT TAB */}');
const paginationStart = content.indexOf('{/* PAGINATION CONTROLS */}');

if (libStart !== -1 && contentStart !== -1 && paginationStart !== -1) {
    const beforeLib = content.substring(0, libStart);
    const afterContent = content.substring(paginationStart);

    const libTab = 
{/* LIBRARY TAB */}
{activeTab === 'library' && (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <FileText className="text-[#11B4D4] w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Uploaded Documents</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Document Title</th>
                        <th className="px-6 py-4">Uploaded By</th>
                        <th className="px-6 py-4">Agency</th>
                        <th className="px-6 py-4">Date & Size</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan="6" className="text-center p-8"><Loader2 className="animate-spin text-slate-500 mx-auto" size={24} /></td></tr>
                    ) : currentItems.length === 0 ? (
                        <tr><td colSpan="6" className="text-center text-slate-500 p-8 font-medium">No documents found in library.</td></tr>
                    ) : (
                        currentItems.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-[#123971] cursor-pointer hover:underline" onClick={() => setSelectedPair(doc)}>
                                    {doc.versions?.[0]?.filename || 'Unknown File'}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">
                                    @{doc.versions?.[0]?.uploader?.username || doc.uploadedBy?.username || 'System'}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">
                                    {doc.agency?.name || '-'}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                                    {new Date(doc.createdAt).toLocaleDateString()} <br/>
                                    {(doc.versions?.[0]?.fileSizeBytes ? (doc.versions[0].fileSizeBytes / 1024 / 1024).toFixed(2) : 0)} MB
                                </td>
                                <td className="px-6 py-4">
                                    <span className={\px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \\}>
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
;

    const contentTab = 
{/* CONTENT TAB */}
{activeTab === 'content' && (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Sparkles className="text-purple-500 w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Generated Contents</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Title / Topic</th>
                        <th className="px-6 py-4">Source Document</th>
                        <th className="px-6 py-4">Date Extracted</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan="5" className="text-center p-8"><Loader2 className="animate-spin text-slate-500 mx-auto" size={24} /></td></tr>
                    ) : currentItems.length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-slate-500 p-8 font-medium">No generated content found.</td></tr>
                    ) : (
                        currentItems.map(doc => {
                            const content = doc.versions?.[0]?.content;
                            const isPending = doc.status === 'PENDING_EXTRACTION' || !content?.dynamicMetadata;
                            return (
                                <tr key={\content-\\} className="hover:bg-slate-50 transition-colors group">
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
                                            <span className={\px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \\}>
                                                {doc.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!isPending && (
                                            <button
                                                onClick={() => handleEditDataClick(doc)}
                                                className="px-4 py-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-2"
                                                title="View/Edit Generated Content"
                                            >
                                                <Edit size={14} /> View Content
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
;

    fs.writeFileSync('src/pages/ManageDocuments.jsx', beforeLib + libTab + contentTab + afterContent);
    console.log("Successfully replaced tabs with standard tables.");
} else {
    console.error("Could not find markers.");
}
