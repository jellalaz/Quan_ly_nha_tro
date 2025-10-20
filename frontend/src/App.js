import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import Rooms from './pages/Rooms';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Register from './pages/Register';
import Profile from './pages/Profile';
import authService from './services/authService';

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
            <AntdApp>
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
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
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

                            {/* Profile route for both roles under protected layout */}
                            <Route path="profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </Router>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;