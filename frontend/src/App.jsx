import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './pages/AuthScreen';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ManageUsers from './pages/ManageUsers';

// ==========================================
// DUMMY PLACEHOLDER PAGES
// ==========================================
const DashboardOverview = () => (
  <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
    <p className="text-gray-500">Welcome to the K-OWL Super Admin Dashboard.</p>
  </div>
);

const ManageAgencies = () => (
  <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Manage Agencies</h2>
    <p className="text-gray-500">Agency management interface and data table will go here.</p>
  </div>
);

// ==========================================
// MAIN APP COMPONENT & ROUTING
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<AuthScreen />} />
        
        {/* PROTECTED ADMIN ROUTES (Uses Layout Shell) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default to dashboard when visiting root "/" */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="agencies" element={<ManageAgencies />} />
        </Route>

        {/* CATCH-ALL ROUTE (Redirect unknown URLs to login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;