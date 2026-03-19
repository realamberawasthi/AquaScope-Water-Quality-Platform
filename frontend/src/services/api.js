import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData);
    return response.data;
};

export const getPublicSummary = async () => {
    const response = await api.get('/public/summary');
    return response.data;
};

export const getChartData = async (country = null) => {
    try {
        const url = country
            ? `/public/chart-data?country=${encodeURIComponent(country)}`
            : `/public/chart-data`;
        const response = await api.get(url); // Using 'api' instance to maintain interceptors and baseURL
        return response.data;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return null;
    }
};

export const getCountryDetails = async (countryName) => {
    const response = await api.get(`/public/country/${countryName}`);
    return response.data;
};

export const predictRisk = async (data) => {
    const response = await api.post('/public/predict-risk', data);
    return response.data;
};


export const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/agency/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const trainModel = async (datasetId) => {
    const response = await api.post(`/agency/train/${datasetId}`);
    return response.data;
};

export const createAgency = async (data) => {
    const response = await api.post('/admin/agencies', data);
    return response.data;
};

export const getAgencies = async () => {
    const response = await api.get('/admin/agencies');
    return response.data;
};

export const deleteAgency = async (id) => {
    const response = await api.delete(`/admin/agencies/${id}`);
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const getActivityLogs = async (action = null, limit = 100) => {
    let url = `/admin/activity-logs?limit=${limit}`;
    if (action) url += `&action=${action}`;
    const response = await api.get(url);
    return response.data;
};

export default api;
