import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import Rooms from './pages/Rooms';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Owners from './pages/Owners';
import OwnerDetails from './pages/OwnerDetails';
import AdminHouses from './pages/AdminHouses';
import AdminReports from './pages/AdminReports';
import { authService } from './services/authService';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Owner Route Component
const OwnerRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!authService.isOwner()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin routes */}
            <Route 
              path="owners" 
              element={
                <AdminRoute>
                  <Owners />
                </AdminRoute>
              } 
            />
            <Route 
              path="owners/:ownerId" 
              element={
                <AdminRoute>
                  <OwnerDetails />
                </AdminRoute>
              } 
            />
            <Route 
              path="admin/houses" 
              element={
                <AdminRoute>
                  <AdminHouses />
                </AdminRoute>
              } 
            />
            <Route 
              path="admin/reports" 
              element={
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
              } 
            />
            
            {/* Owner routes */}
            <Route 
              path="houses" 
              element={
                <OwnerRoute>
                  <Houses />
                </OwnerRoute>
              } 
            />
            <Route 
              path="rooms" 
              element={
                <OwnerRoute>
                  <Rooms />
                </OwnerRoute>
              } 
            />
            <Route 
              path="contracts" 
              element={
                <OwnerRoute>
                  <Contracts />
                </OwnerRoute>
              } 
            />
            <Route 
              path="invoices" 
              element={
                <OwnerRoute>
                  <Invoices />
                </OwnerRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <OwnerRoute>
                  <Reports />
                </OwnerRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;