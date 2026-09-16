import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Globe, Edit, Loader2, X, Building2, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const ManageAgencies = () => {
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
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
        if (!searchQuery) return true;
        return agency.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
                <p className="text-gray-500 font-medium">Loading agencies...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            {/* Header Area */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Manage Agencies</h2>
                    <p className="text-gray-500 mt-1">Configure and manage participating government agencies.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search agencies by name..." 
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium text-sm"
                        style={{ '--tw-ring-color': secondaryCyan }}
                    />
                </div>
            </div>

            {/* Banner Card Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {/* Add New Card */}
                <div 
                    onClick={handleAddClick}
                    className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-[#11B4D4] flex flex-col items-center justify-center min-h-[320px] cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-xl"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-[#11B4D4]/10">
                        <Plus size={32} style={{ color: secondaryCyan }} />
                    </div>
                    <span className="font-bold text-gray-600 group-hover:text-[#11B4D4] transition-colors text-lg">Add New Agency</span>
                </div>

                {/* Agency Cards */}
                {filteredAgencies.map(agency => (
                    <div key={agency.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[320px] relative overflow-hidden group">
                        
                        {/* Banner Image (Top Half) */}
                        <div className="relative h-32 w-full">
                            <img 
                                src={agency.bannerUrl || defaultBanner} 
                                alt={`${agency.name} Banner`} 
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.src = defaultBanner; }}
                            />
                            {/* Overlay Gradient for readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                        </div>
                        
                        {/* Body (Bottom Half) */}
                        <div className="p-5 pt-12 flex-1 flex flex-col relative bg-white">
                            {/* Logo (Overlapping) */}
                            <div className="absolute -top-8 left-5">
                                {agency.logoUrl ? (
                                    <img 
                                        src={agency.logoUrl} 
                                        alt={`${agency.name} Logo`} 
                                        className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-sm bg-white"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                {/* Fallback Initial Logo (shown if no logoUrl, or if img fails) */}
                                <div 
                                    className={`h-16 w-16 rounded-full border-4 border-white shadow-sm bg-[#123971] items-center justify-center text-xl font-bold text-white ${agency.logoUrl ? 'hidden' : 'flex'}`}
                                >
                                    {agency.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            
                            {/* Edit Button */}
                            <button 
                                onClick={() => handleEditClick(agency)}
                                className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-500 hover:text-[#11B4D4] hover:bg-[#11B4D4]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                                title="Edit Agency"
                            >
                                <Edit size={16} />
                            </button>

                            <h3 className="text-xl font-bold mb-2" style={{ color: primaryNavy }}>{agency.name}</h3>
                            
                            <p className="text-gray-500 text-sm flex-1 line-clamp-2 leading-relaxed mb-4">
                                {agency.description || <span className="italic text-gray-400">No description provided.</span>}
                            </p>

                            {/* Footer Icons */}
                            <div className="pt-4 border-t border-gray-100 space-y-2 mt-auto">
                                {agency.address && (
                                    <div className="flex items-start gap-2 text-gray-600 text-xs font-medium">
                                        <MapPin size={14} className="text-[#11B4D4] mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-1" title={agency.address}>{agency.address}</span>
                                    </div>
                                )}
                                {agency.website && (
                                    <div className="flex items-center gap-2 text-gray-600 text-xs font-medium">
                                        <Globe size={14} className="text-[#11B4D4] flex-shrink-0" />
                                        <a href={agency.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#11B4D4] hover:underline line-clamp-1">
                                            {agency.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* OVERLAYS: ADD & EDIT MODALS */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {isAddModalOpen ? <Building2 size={20} style={{ color: secondaryCyan }} /> : <Edit size={20} style={{ color: secondaryCyan }} />}
                                {isAddModalOpen ? 'Register New Agency' : 'Edit Agency Details'}
                            </h2>
                            <button 
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 p-6">
                            <form id="agencyForm" onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Agency Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. STII" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Brief overview of the agency..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all resize-none"></textarea>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Banner URL</label>
                                        <input type="url" name="bannerUrl" value={formData.bannerUrl} onChange={handleInputChange} placeholder="https://unsplash.com/photo..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm" />
                                        <p className="text-[10px] text-gray-400 mt-1">Recommended size: 600x200px</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><ImageIcon size={14}/> Logo URL</label>
                                        <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all text-sm" />
                                        <p className="text-[10px] text-gray-400 mt-1">Recommended size: 256x256px</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Complete physical address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                                    <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11B4D4]/50 focus:border-[#11B4D4] transition-all" />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" form="agencyForm" className="flex-1 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: secondaryCyan }}>
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
