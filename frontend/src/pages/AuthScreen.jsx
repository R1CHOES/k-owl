import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import api from '../utils/api';
import logo from '../assets/k-owl-main-logo.png';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [agencies, setAgencies] = useState([]);
    const [roles, setRoles] = useState([]);

    // Exact colors extracted from the K-OWL Logo
    const primaryNavy = '#123971';
    const secondaryCyan = '#11B4D4';

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [agenciesRes, rolesRes] = await Promise.all([
                    api.get('/api/agencies'),
                    api.get('/api/roles')
                ]);
                setAgencies(agenciesRes.data);

                // Only allow registration for specific roles
                const allowedSlugs = ['agency-focal-person', 'qa-reviewer', 'content-approver'];
                const filteredRoles = rolesRes.data.filter(role => allowedSlugs.includes(role.slug));
                setRoles(filteredRoles);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };
        fetchMetadata();
    }, []);

    return (
        <div className="flex h-screen w-full relative overflow-hidden bg-white font-sans">

            {/* LEFT PANEL (50%) - Branding & Messaging */}
            <div
                className="hidden md:flex w-1/2 h-full flex-col justify-center items-center p-12 text-center relative"
                style={{ background: `linear-gradient(135deg, ${primaryNavy} 0%, #0A2044 100%)` }}
            >
                {/* Subtle decorative background circles */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-4 border-white"></div>
                    <div className="absolute bottom-12 right-12 w-64 h-64 rounded-full border-2 border-white"></div>
                </div>

                <div className="max-w-md text-white z-10 animate-fade-in-up">
                    <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
                        K-OWL Knowledge
                        <br />
                        <span style={{ color: secondaryCyan }}>Management System</span>
                    </h1>
                    <p className="text-lg opacity-80 font-light mt-4">
                        Empowering Project ONEOWL with seamless information sharing, intelligent collaboration, and secure access across agencies.
                    </p>
                </div>
            </div>

            {/* INTERSECTING LOGO (Absolute Center) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-36 h-36 rounded-full bg-white border-[6px] border-white shadow-2xl z-20 overflow-hidden transition-transform hover:scale-105 duration-300">
                <img
                    src={logo}
                    alt="K-OWL Logo"
                    className="w-full h-full object-contain p-2"
                />
            </div>

            {/* RIGHT PANEL (50%) - Interaction & Form */}
            <div className="w-full md:w-1/2 h-full flex justify-center items-center bg-gray-50/50 p-6 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-md flex flex-col pt-8 pb-8">

                    <div className="text-center mb-8 md:hidden">
                        <h2 className="text-3xl font-bold text-[#123971]">K-OWL</h2>
                        <p className="text-gray-500 text-sm mt-1">Knowledge Management System</p>
                    </div>

                    {/* SLIDING PILL TOGGLE */}
                    <div className="relative flex w-full max-w-[280px] bg-gray-200/80 rounded-full p-1.5 mb-10 mx-auto shadow-inner">
                        {/* The sliding background highlight */}
                        <div
                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-md transition-transform duration-300 ease-out"
                            style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
                        />

                        <button
                            onClick={() => setIsLogin(true)}
                            className={`relative z-10 flex-1 py-2.5 text-sm font-bold tracking-wide transition-colors duration-300 ${isLogin ? 'text-[#123971]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`relative z-10 flex-1 py-2.5 text-sm font-bold tracking-wide transition-colors duration-300 ${!isLogin ? 'text-[#123971]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Register
                        </button>
                    </div>

                    {/* DYNAMIC FORM AREA */}
                    <div className="w-full min-h-[300px]">
                        {isLogin ? (
                            <LoginForm secondaryCyan={secondaryCyan} />
                        ) : (
                            <RegisterForm secondaryCyan={secondaryCyan} agencies={agencies} roles={roles} />
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
};

export default AuthScreen;
