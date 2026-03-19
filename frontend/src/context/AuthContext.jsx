import React, { createContext, useContext, useState, useEffect } from 'react';
import { login } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        if (token && role) {
            setUser({ username, role, token });
        }
        setLoading(false);
    }, []);

    const handleLogin = async (username, password) => {
        try {
            const data = await login(username, password);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);
            setUser({ username, role: data.role, token: data.access_token });
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
