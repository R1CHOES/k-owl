import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

const LoginForm = ({ secondaryCyan }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authStatus, setAuthStatus] = useState(null); // { type: 'pending' | 'rejected' | 'error', message: '' }

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/auth/login', { email, password });
            
            // Save token
            localStorage.setItem('token', res.data.token);

            // Show success popup
            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome back to K-OWL!',
                confirmButtonColor: secondaryCyan
            }).then(() => {
                // Decode token to get user payload
                const decoded = jwtDecode(res.data.token);
                
                // Save RBAC context to local storage
                localStorage.setItem('role', decoded.roleSlug || decoded.role);
                if (decoded.agencyId) {
                    localStorage.setItem('agencyId', decoded.agencyId);
                }

                // Route everyone to the dashboard (the dashboard will handle role-based UI restrictions)
                navigate('/dashboard');
            });

        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Invalid credentials. Please try again.';
            
            if (errorMsg === 'Account pending approval') {
                setAuthStatus({ type: 'pending', message: 'Your account registration has been received and is currently pending approval by an administrator. You will be able to log in once it is approved.' });
            } else if (errorMsg === 'Account rejected') {
                setAuthStatus({ type: 'rejected', message: 'Your account registration was reviewed and has been rejected. If you believe this is a mistake, please contact your agency administrator.' });
            } else {
                setAuthStatus(null);
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: errorMsg,
                    confirmButtonColor: secondaryCyan
                });
            }
        }
    };

    return (
        <form className="w-full space-y-4 animate-fade-in" onSubmit={handleLogin}>

            {authStatus && (
                <div className={`p-4 rounded-xl border ${
                    authStatus.type === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    authStatus.type === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                    'bg-red-50 border-red-200 text-red-800'
                } mb-4 text-sm font-medium animate-fade-in-up flex items-start gap-3`}>
                    <div className="shrink-0 mt-0.5">
                        {authStatus.type === 'pending' ? '⏳' : '❌'}
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">
                            {authStatus.type === 'pending' ? 'Account Pending' : 'Account Rejected'}
                        </h4>
                        <p className="opacity-90 leading-relaxed">{authStatus.message}</p>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@agency.gov.ph"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
                    <span>Password</span>
                    <a href="#" className="text-xs hover:underline transition-colors" style={{ color: secondaryCyan }}>
                        Forgot password?
                    </a>
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': secondaryCyan }}
                />
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
                Sign In securely
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

        </form>
    );
};

export default LoginForm;
