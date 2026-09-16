import React, { useState } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const RegisterForm = ({ secondaryCyan, agencies, roles }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        designation: '',
        agencyId: '',
        roleId: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Convert to integers before sending
            const payload = {
                ...formData,
                agencyId: parseInt(formData.agencyId),
                roleId: parseInt(formData.roleId)
            };

            const res = await api.post('/api/auth/register', payload);
            
            Swal.fire({
                icon: 'success',
                title: 'Account Created',
                text: 'User has been registered successfully!',
                confirmButtonColor: secondaryCyan
            });

            // Reset form
            setFormData({
                username: '',
                email: '',
                password: '',
                designation: '',
                agencyId: '',
                roleId: ''
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: error.response?.data?.error || 'An error occurred during registration.',
                confirmButtonColor: secondaryCyan
            });
        }
    };

    return (
        <form className="w-full space-y-4 animate-fade-in" onSubmit={handleRegister}>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter username"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@agency.gov.ph"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Designation</label>
                <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g., Senior Research Specialist"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Agency</label>
                    <select
                        name="agencyId"
                        value={formData.agencyId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat"
                        style={{ 
                            '--tw-ring-color': secondaryCyan,
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.2em'
                        }}
                    >
                        <option value="">Select Agency</option>
                        {agencies?.map((agency) => (
                            <option key={agency.id} value={agency.id}>
                                {agency.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                    <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat"
                        style={{ 
                            '--tw-ring-color': secondaryCyan,
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.2em'
                        }}
                    >
                        <option value="">Select Role</option>
                        {roles?.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.roleName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vibrant Submit Button */}
            <button
                type="submit"
                className="w-full py-3.5 mt-6 rounded-xl font-bold text-white shadow-lg transition-transform transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                style={{
                    backgroundColor: secondaryCyan,
                    boxShadow: `0 10px 20px -5px ${secondaryCyan}60`
                }}
            >
                Create Account
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

        </form>
    );
};

export default RegisterForm;
