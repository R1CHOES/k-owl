import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './pages/AuthScreen';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ManageUsers from './pages/ManageUsers';
import ManageAgencies from './pages/ManageAgencies';
import AgencyProfile from './pages/AgencyProfile';
import DashboardOverview from './pages/DashboardOverview';
import ManageDocuments from './pages/ManageDocuments';
import DocumentDetails from './pages/DocumentDetails';
import QAApprovals from './pages/QAApprovals';
import ReviewHistory from './pages/ReviewHistory';

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
          path="/:roleSlug" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default to dashboard when visiting root "/:roleSlug" */}
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="documents" element={<ManageDocuments />} />
          <Route path="documents/:id" element={<DocumentDetails />} />
          <Route path="qa-approvals" element={<QAApprovals />} />
          <Route path="review-history" element={<ReviewHistory />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="agencies" element={<ManageAgencies />} />
          <Route path="agencies/:id" element={<AgencyProfile />} />
        </Route>

        {/* CATCH-ALL ROUTE (Redirect unknown URLs to login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;