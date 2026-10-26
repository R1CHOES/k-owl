import sys

with open("src/pages/ManageDocuments.jsx", "r", encoding="utf-8") as f:
    code = f.read()

badge_function = """
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING_EXTRACTION': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider whitespace-nowrap">⚙️ AI Processing</span>;
            case 'IN_QA': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">🟡 QA Review</span>;
            case 'PENDING_APPROVAL': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">🟣 Pending Auth</span>;
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">✅ Approved</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">❌ Rejected</span>;
            case 'PUBLISHED': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-[#11B4D4]/10 text-[#11B4D4] rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Published</span>;
            case 'DRAFT': return <span className="inline-flex items-center gap-1 px-4 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Draft</span>;
            default: return <span className="inline-flex items-center gap-1 px-4 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{status.replace('_', ' ')}</span>;
        }
    };
"""

# Insert it before handleEditClick
insert_pos = code.find("const handleEditClick")
if insert_pos != -1:
    code = code[:insert_pos] + badge_function + code[insert_pos:]

# Now replace the inline badges with {getStatusBadge(doc.status)}
old_lib_badge = """<span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block whitespace-nowrap ${doc.status === 'IN_QA' ? 'bg-amber-100 text-amber-700' : doc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-cyan-100 text-cyan-700'}`}>
                                                        {doc.status.replace('_', ' ')}
                                                    </span>"""
code = code.replace(old_lib_badge, "{getStatusBadge(doc.status)}")

old_content_badge = """{isPending ? (
                                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block whitespace-nowrap bg-purple-100 text-purple-700 animate-pulse">
                                                                Processing...
                                                            </span>
                                                        ) : (
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block whitespace-nowrap ${doc.status === 'IN_QA' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {doc.status.replace('_', ' ')}
                                                            </span>
                                                        )}"""
code = code.replace(old_content_badge, "{getStatusBadge(doc.status)}")

with open("src/pages/ManageDocuments.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Done ManageDocuments badge refactor")
