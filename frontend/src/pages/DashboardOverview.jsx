import React, { useState, useEffect } from 'react';
import { Users, Building2, Activity, Loader2, Calendar } from 'lucide-react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalAgencies: 0,
        recentUsers: []
    });
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('Admin');

    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        // Try to get username from token
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = jwtDecode(token);
                if (decoded.username) {
                    setUsername(decoded.username);
                }
            }
        } catch (e) {
            console.error("Could not decode token");
        }

        const fetchStats = async () => {
            try {
                const res = await api.get('/api/dashboard/stats');
                setStats(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: secondaryCyan }} />
                <p className="text-gray-500 font-medium">Loading dashboard insights...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-8">
            
            {/* Header Greeting */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome back to K-OWL, {username}!</h1>
                <p className="text-gray-500 mt-2">Here is a quick overview of your system's current status and activity.</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Users Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${secondaryCyan}15` }}>
                        <Users size={28} style={{ color: secondaryCyan }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Users</p>
                        <h2 className="text-4xl font-black text-gray-800">{stats.totalUsers}</h2>
                    </div>
                </div>

                {/* Active Users Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${secondaryCyan}15` }}>
                        <Activity size={28} style={{ color: secondaryCyan }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Active Users</p>
                        <h2 className="text-4xl font-black text-gray-800">{stats.activeUsers}</h2>
                    </div>
                </div>

                {/* Total Agencies Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${secondaryCyan}15` }}>
                        <Building2 size={28} style={{ color: secondaryCyan }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Agencies</p>
                        <h2 className="text-4xl font-black text-gray-800">{stats.totalAgencies}</h2>
                    </div>
                </div>

            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Recent User Registrations</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">The latest members added to the platform</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {stats.recentUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No recent users found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Agency</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Date Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5 flex items-center gap-4">
                                            <div 
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm" 
                                                style={{ backgroundColor: primaryNavy }}
                                            >
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-[#11B4D4] transition-colors">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-medium text-gray-700">{user.agency?.name || 'N/A'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-gray-200">
                                                {user.role?.roleName || 'No Role'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardOverview;
