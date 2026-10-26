import sys

with open("src/pages/QAApprovals.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add states
state_injection = """
    // Table states
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [agencies, setAgencies] = useState([]);
    const [agencyId, setAgencyId] = useState("");
"""
code = code.replace("""
    // Table states
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
""", state_injection)


# 2. Update fetchData
old_fetch = """    const fetchData = async () => {
        try {
            const docsRes = await api.get('/api/documents');"""
new_fetch = """    const fetchData = async () => {
        try {
            const [agenciesRes, docsRes] = await Promise.all([
                api.get('/api/agencies'),
                api.get('/api/documents')
            ]);
            setAgencies(agenciesRes.data);"""
code = code.replace(old_fetch, new_fetch)


# 3. Update filteredDocuments
old_filter = """    const filteredDocuments = documents.filter(doc => {
        if (!searchTerm) return true;
        const title = doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || '';
        const username = doc.versions?.[0]?.uploader?.username || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) || username.toLowerCase().includes(searchTerm.toLowerCase());
    });"""
new_filter = """    const filteredDocuments = documents.filter(doc => {
        if (agencyId && doc.agencyId !== parseInt(agencyId)) return false;
        if (!searchTerm) return true;
        const title = doc.versions?.[0]?.content?.title || doc.versions?.[0]?.filename || '';
        const username = doc.versions?.[0]?.uploader?.username || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) || username.toLowerCase().includes(searchTerm.toLowerCase());
    });"""
code = code.replace(old_filter, new_filter)


# 4. Add the Dropdown to the UI next to the search bar
# Let's find the Search bar container
search_bar_code = """<div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by title or uploader..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium"
                        />
                    </div>"""

dropdown_code = """<div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by title or uploader..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium"
                        />
                    </div>
                    {['superadmin', 'kbm', 'knowledge_base_manager'].includes(localStorage.getItem('role') || '') && (
                        <select
                            value={agencyId}
                            onChange={(e) => setAgencyId(e.target.value)}
                            className="w-full sm:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm font-medium text-slate-500"
                        >
                            <option value="">All Agencies</option>
                            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    )}"""

code = code.replace(search_bar_code, dropdown_code)

with open("src/pages/QAApprovals.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Done")
