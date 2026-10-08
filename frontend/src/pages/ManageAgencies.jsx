import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Globe, Edit, Loader2, X, Building2, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const AgencyAvatar = ({ agency }) => {
    const [imgError, setImgError] = useState(false);
    const initials = agency.name.replace('DOST-', '').substring(0, 3);
    
    return (
        <div className="w-10 h-10 rounded-full bg-[#123971] text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-slate-200">
            {agency.logoUrl && !imgError ? (
                <img 
                    src={agency.logoUrl} 
                    alt={agency.name} 
                    className="w-full h-full object-cover bg-white"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="text-[12px]">{initials}</span>
            )}
        </div>
    );
};

const ManageAgencies = () => {
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCluster, setSelectedCluster] = useState('All');
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        website: '',
        bannerUrl: '',
        logoUrl: ''
    });

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';
    const defaultBanner = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            const res = await api.get('/api/agencies');
            setAgencies(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch agencies', error);
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Agencies',
                text: 'Could not fetch agency data. Please try again.',
                confirmButtonColor: secondaryCyan
            });
            setLoading(false);
        }
    };

    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = !searchQuery || agency.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCluster = selectedCluster === 'All' || (agency.cluster || 'Other Agencies') === selectedCluster;
        return matchesSearch && matchesCluster;
    });

    const uniqueClusters = [...new Set(agencies.map(a => a.cluster).filter(Boolean))].sort();
    const hasOtherAgencies = agencies.some(a => !a.cluster);
    const clusters = ['All', ...uniqueClusters, ...(hasOtherAgencies ? ['Other Agencies'] : [])];

    const groupedAgencies = filteredAgencies.reduce((acc, agency) => {
        const clusterName = agency.cluster || 'Other Agencies';
        if (!acc[clusterName]) acc[clusterName] = [];
        acc[clusterName].push(agency);
        return acc;
    }, {});

    const handleAddClick = () => {
        setFormData({ name: '', description: '', address: '', website: '', bannerUrl: '', logoUrl: '' });
        setIsAddModalOpen(true);
    };

    const handleEditClick = (agency) => {
        setSelectedAgency(agency);
        setFormData({
            name: agency.name,
            description: agency.description || '',
            address: agency.address || '',
            website: agency.website || '',
            bannerUrl: agency.bannerUrl || '',
            logoUrl: agency.logoUrl || ''
        });
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/agencies', formData);
            setAgencies([...agencies, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setIsAddModalOpen(false);
            Swal.fire({
                icon: 'success',
                title: 'Agency Created',
                text: 'New agency has been successfully added.',
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: error.response?.data?.error || 'Failed to create agency.',
                confirmButtonColor: secondaryCyan
            });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch(`/api/agencies/${selectedAgency.id}`, formData);
            const updated = agencies.map(a => a.id === res.data.id ? res.data : a).sort((a, b) => a.name.localeCompare(b.name));
            setAgencies(updated);
            setIsEditModalOpen(false);
            Swal.fire({
                icon: 'success',
                title: 'Agency Updated',
                text: 'Agency details have been successfully updated.',
                confirmButtonColor: secondaryCyan
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.response?.data?.error || 'Failed to update agency.',
                confirmButtonColor: secondaryCyan
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-slate-500 font-medium">Loading agencies...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            {/* Header Area */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#123971]">Manage Agencies</h2>
                    <p className="text-slate-500 mt-2">Configure and manage participating government agencies.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search agencies by name..." 
                            className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-sm"
                            style={{ '--tw-ring-color': secondaryCyan }}
                        />
                    </div>
                    <select
                        value={selectedCluster}
                        onChange={(e) => setSelectedCluster(e.target.value)}
                        className="w-full md:w-48 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-sm text-slate-700"
                        style={{ '--tw-ring-color': secondaryCyan }}
                    >
                        {clusters.map(c => (
                            <option key={c} value={c}>{c === 'All' ? 'All Clusters' : c}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleAddClick}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white font-bold rounded-xl shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                        style={{ backgroundColor: secondaryCyan }}
                    >
                        <Plus size={16} strokeWidth={3} /> Add Agency
                    </button>
                </div>
            </div>

            {/* Official Data Table Layout */}
            <div className="flex-1 flex flex-col mb-8 gap-8">
                {Object.entries(groupedAgencies).length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-12 text-center text-slate-500 font-medium">
                        No agencies found matching your search.
                    </div>
                ) : (
                    Object.entries(groupedAgencies).map(([clusterName, clusterAgencies]) => (
                        <div key={clusterName} className="flex flex-col">
                            <h3 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: primaryNavy, borderColor: 'rgba(18, 57, 113, 0.1)' }}>
                                {clusterName}
                            </h3>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agency Name</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Users</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Documents</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {clusterAgencies.map(agency => (
                                                <tr key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <AgencyAvatar agency={agency} />
                                                            <div>
                                                                <div className="font-bold text-[#123971]">{agency.name}</div>
                                                                {agency.website && <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#11B4D4] hover:underline flex items-center gap-2 mt-0.5"><Globe size={16}/> Website</a>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-500 line-clamp-2 max-w-xs">{agency.description || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200">
                                                            {agency._count?.users || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200">
                                                            {agency._count?.Document || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <button 
                                                                onClick={() => window.location.href = `/${localStorage.getItem('role') || 'superadmin'}/agencies/${agency.id}`}
                                                                className="px-4 py-2 text-xs font-bold text-[#11B4D4] bg-[#11B4D4]/10 rounded-xl hover:bg-[#11B4D4]/20 transition-colors border border-[#11B4D4]/20"
                                                            >
                                                                View Profile
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditClick(agency)}
                                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                                                title="Edit Agency"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* OVERLAYS: ADD & EDIT MODALS */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
                            <h2 className="text-xl font-bold text-[#123971] flex items-center gap-2">
                                {isAddModalOpen ? <Building2 size={24} style={{ color: secondaryCyan }} /> : <Edit size={24} style={{ color: secondaryCyan }} />}
                                {isAddModalOpen ? 'Register New Agency' : 'Edit Agency Details'}
                            </h2>
                            <button 
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 p-6">
                            <form id="agencyForm" onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Agency Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. STII" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Brief overview of the agency..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all resize-none"></textarea>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Banner URL</label>
                                        <input type="url" name="bannerUrl" value={formData.bannerUrl} onChange={handleInputChange} placeholder="https://unsplash.com/photo..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm" />
                                        <p className="text-[10px] text-slate-400 mt-2">Recommended size: 600x200px</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Logo URL</label>
                                        <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm" />
                                        <p className="text-[10px] text-slate-400 mt-2">Recommended size: 256x256px</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Complete physical address" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                                    <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 pt-4 border-t border-slate-200 bg-slate-50 flex gap-4">
                            <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" form="agencyForm" className="flex-1 py-2 text-white font-bold rounded-xl shadow-sm hover:shadow-sm transition-all" style={{ backgroundColor: secondaryCyan }}>
                                {isAddModalOpen ? 'Create Agency' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAgencies;
