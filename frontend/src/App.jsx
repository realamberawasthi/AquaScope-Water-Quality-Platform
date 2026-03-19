import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicDashboard from './pages/PublicDashboard';
import AgencyPortal from './pages/AgencyPortal';
import AdminPortal from './pages/AdminPortal';
import Login from './pages/Login';

const PrivateRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                                AquaScope 💧
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Public Dashboard</a>
                        {user ? (
                            <>
                                {user.role === 'agency' && <a href="/agency" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Agency Portal</a>}
                                {user.role === 'admin' && <a href="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Admin Portal</a>}
                                <span className="text-gray-500 text-sm">Hi, {user.username}</span>
                                <button onClick={logout} className="text-red-600 hover:text-red-700 text-sm font-medium">Logout</button>
                            </>
                        ) : (
                            <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Agency Login</a>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50 font-sans">
                    <Navbar />
                    <main className="py-6">
                        <Routes>
                            <Route path="/" element={<PublicDashboard />} />
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/agency"
                                element={
                                    <PrivateRoute role="agency">
                                        <AgencyPortal />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <PrivateRoute role="admin">
                                        <AdminPortal />
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
