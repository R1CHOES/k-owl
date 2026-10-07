import React, { useState, useMemo } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';

const RegisterForm = ({ secondaryCyan, agencies, roles }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        designation: '',
        agencyId: '',
        roleId: ''
    });

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Password strength logic
    const passwordRequirements = [
        { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
        { id: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
        { id: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
        { id: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
        { id: 'special', label: 'One special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>\-_]/.test(pw) }
    ];

    const allRequirementsMet = passwordRequirements.every(req => req.test(formData.password));
    const passwordScore = passwordRequirements.filter(req => req.test(formData.password)).length;

    // Agency Grouping Logic
    const categories = useMemo(() => {
        if (!agencies) return [];
        const clusters = new Set(agencies.map(a => a.cluster).filter(Boolean));
        return Array.from(clusters).sort();
    }, [agencies]);

    // Include 'Other Agencies' for null clusters
    const hasOtherAgencies = agencies?.some(a => !a.cluster);
    const categoryOptions = hasOtherAgencies ? [...categories, "Other Agencies"] : categories;

    const filteredAgencies = useMemo(() => {
        if (!selectedCategory) return [];
        if (selectedCategory === "Other Agencies") {
            return agencies.filter(a => !a.cluster);
        }
        return agencies.filter(a => a.cluster === selectedCategory);
    }, [agencies, selectedCategory]);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== confirmPassword) {
            return Swal.fire({
                icon: 'error',
                title: 'Passwords Mismatch',
                text: 'The passwords you entered do not match. Please try again.',
                confirmButtonColor: '#123971'
            });
        }

        if (!allRequirementsMet) {
            return Swal.fire({
                icon: 'error',
                title: 'Weak Password',
                text: 'Please ensure your password meets all the security requirements.',
                confirmButtonColor: '#123971'
            });
        }

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
                title: 'Registration Received',
                text: 'Your account has been successfully registered! Please wait for an administrator to approve your account before logging in.',
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
            setConfirmPassword('');
            setSelectedCategory('');

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

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="john.doe"
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ '--tw-ring-color': secondaryCyan }}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ '--tw-ring-color': secondaryCyan }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={(e) => {
                                // Allow click on eye icon without instantly hiding the checklist
                                if (!e.relatedTarget || e.relatedTarget.tagName !== 'BUTTON') {
                                    setIsPasswordFocused(false);
                                }
                            }}
                            required
                            placeholder="••••••••"
                            className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                            style={{ '--tw-ring-color': secondaryCyan }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Minimalist Segmented Password Strength */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(isPasswordFocused || formData.password.length > 0) ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        <div className="flex gap-2 w-full h-1.5 mb-1.5">
                            <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore > 0 ? (passwordScore <= 2 ? 'bg-red-500' : passwordScore <= 4 ? 'bg-orange-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                            <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore >= 3 ? (passwordScore <= 4 ? 'bg-orange-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                            <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore === 5 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-wider mb-3 transition-colors duration-300 ${passwordScore <= 2 ? 'text-red-500' : passwordScore <= 4 ? 'text-orange-500' : 'text-green-500'}`}>
                            {passwordScore === 0 ? 'Weak' : passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Medium' : 'Strong'}
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 text-[10px] px-1">
                            {passwordRequirements.map((req) => {
                                const isMet = req.test(formData.password);
                                return (
                                    <li key={req.id} className="flex items-center gap-1.5">
                                        {isMet ? (
                                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                        ) : (
                                            <Circle size={12} className="text-gray-300 shrink-0" />
                                        )}
                                        <span className={isMet ? 'text-emerald-700 font-medium' : 'text-gray-500 font-medium'}>
                                            {req.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                            style={{ '--tw-ring-color': secondaryCyan }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full border-t border-gray-100 my-4"></div>

            <div className="flex gap-4">
                <div className="flex-1">
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
                <div className="flex-1 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                    <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat cursor-pointer"
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

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Agency Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setFormData(prev => ({ ...prev, agencyId: '' }));
                        }}
                        required
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat cursor-pointer"
                        style={{ 
                            '--tw-ring-color': secondaryCyan,
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.2em'
                        }}
                    >
                        <option value="">Select Category</option>
                        {categoryOptions.map((cat, idx) => (
                            <option key={idx} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specific Agency</label>
                    <select
                        name="agencyId"
                        value={formData.agencyId}
                        onChange={handleChange}
                        required
                        disabled={!selectedCategory}
                        className={`w-full px-4 py-3 ${!selectedCategory ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white cursor-pointer'} rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat`}
                        style={{ 
                            '--tw-ring-color': secondaryCyan,
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.2em'
                        }}
                    >
                        <option value="">Select Agency</option>
                        {filteredAgencies.map((agency) => (
                            <option key={agency.id} value={agency.id}>
                                {agency.name}
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
