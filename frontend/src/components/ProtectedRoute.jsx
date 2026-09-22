import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        
        // We don't need to enforce a specific role here anymore.
        // The AdminLayout and Dashboard components handle RBAC visibility.
        
        return children;
    } catch (error) {
        // Token is invalid or expired
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
