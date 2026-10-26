import sys

with open('src/pages/ManageDocuments.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove View Original from table
btn_start = code.find('<button\\n                                                                onClick={(e) => { e.stopPropagation(); setSelectedPair(doc); }}\\n                                                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors flex items-center gap-2"\\n                                                                title="View Original Traceability"\\n                                                            >\\n                                                                <FileText size={14} /> View Original\\n                                                            </button>')
if btn_start != -1:
    btn_end = btn_start + len('<button\\n                                                                onClick={(e) => { e.stopPropagation(); setSelectedPair(doc); }}\\n                                                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors flex items-center gap-2"\\n                                                                title="View Original Traceability"\\n                                                            >\\n                                                                <FileText size={14} /> View Original\\n                                                            </button>')
    code = code[:btn_start] + code[btn_end:]

# 2. Add View Source Document inside the Editor Modal Header
editor_header = '<h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">'
new_editor_header = """<div className="flex items-center justify-between w-full">
                            <h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">"""

editor_close_header = """<Sparkles size={24} className="text-[#11B4D4]" />
                                AI Content Editor
                            </h2>"""
new_editor_close_header = """<Sparkles size={24} className="text-[#11B4D4]" />
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

code = code.replace(editor_header, new_editor_header).replace(editor_close_header, new_editor_close_header)

with open('src/pages/ManageDocuments.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
