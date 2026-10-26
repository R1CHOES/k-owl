import sys

with open("src/pages/QAApprovals.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the search bar and add the agency dropdown
old_search_block = """                            <div className="relative w-full md:w-64">
                                <input 
                                    type="text" 
                                    placeholder="Search documents..." 
                                    value={searchTerm}
                                    onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                />
                                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>"""

new_search_block = """                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="Search documents..." 
                                        value={searchTerm}
                                        onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    />
                                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                                {['superadmin', 'kbm', 'knowledge_base_manager'].includes(localStorage.getItem('role') || '') && (
                                    <select
                                        value={agencyId}
                                        onChange={(e) => setAgencyId(e.target.value)}
                                        className="w-full sm:w-48 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-600 bg-white"
                                    >
                                        <option value="">All Agencies</option>
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                )}
                            </div>"""

code = code.replace(old_search_block, new_search_block)

with open("src/pages/QAApprovals.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Done dropdown inject!")
