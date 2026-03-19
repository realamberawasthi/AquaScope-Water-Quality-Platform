import React, { useState, useEffect } from 'react';
import { createAgency, getAgencies, deleteAgency, getUsers, deleteUser, getActivityLogs } from '../services/api';
import { Users, Plus, Building2, Activity, Trash2, RefreshCw } from 'lucide-react';

const AdminPortal = () => {
    const [activeTab, setActiveTab] = useState('agencies');
    const [agencies, setAgencies] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', location: '', contact_info: '', admin_username: '', admin_password: '' });
    const [logFilter, setLogFilter] = useState('');

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'agencies') {
                const data = await getAgencies();
                setAgencies(data);
            } else if (activeTab === 'users') {
                const data = await getUsers();
                setUsers(data);
            } else if (activeTab === 'logs') {
                const data = await getActivityLogs(logFilter || null);
                setLogs(data);
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        setLoading(false);
    };

    const handleCreateAgency = async (e) => {
        e.preventDefault();
        try {
            await createAgency(form);
            alert('Agency created successfully!');
            setForm({ name: '', location: '', contact_info: '', admin_username: '', admin_password: '' });
            loadData();
        } catch (e) {
            alert('Failed to create agency');
        }
    };

    const handleDeleteAgency = async (id, name) => {
        if (!confirm(`Delete agency "${name}" and all its users/datasets?`)) return;
        try {
            await deleteAgency(id);
            alert('Agency deleted');
            loadData();
        } catch (e) {
            alert('Failed to delete agency');
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (!confirm(`Delete user "${username}"?`)) return;
        try {
            await deleteUser(id);
            alert('User deleted');
            loadData();
        } catch (e) {
            alert(e.response?.data?.detail || 'Failed to delete user');
        }
    };

    const tabs = [
        { id: 'agencies', label: 'Agencies', icon: Building2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'logs', label: 'Activity Logs', icon: Activity },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
                <button
                    onClick={loadData}
                    className="ml-auto flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Agencies Tab */}
            {activeTab === 'agencies' && (
                <div className="space-y-6">
                    {/* Create Agency Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                            Create New Agency
                        </h2>
                        <form onSubmit={handleCreateAgency} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                className="border rounded-lg p-2"
                                placeholder="Agency Name *"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            <input
                                className="border rounded-lg p-2"
                                placeholder="Location"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                            />
                            <input
                                className="border rounded-lg p-2"
                                placeholder="Contact Info"
                                value={form.contact_info}
                                onChange={e => setForm({ ...form, contact_info: e.target.value })}
                            />

                            <hr className="md:col-span-3 my-2 border-gray-100" />
                            <h3 className="md:col-span-3 text-sm font-medium text-gray-700">Create Agency Admin Account (Optional)</h3>

                            <input
                                className="border rounded-lg p-2"
                                placeholder="Admin Username"
                                value={form.admin_username}
                                onChange={e => setForm({ ...form, admin_username: e.target.value })}
                            />
                            <input
                                className="border rounded-lg p-2"
                                type="password"
                                placeholder="Admin Password"
                                value={form.admin_password}
                                onChange={e => setForm({ ...form, admin_password: e.target.value })}
                            />
                            <button type="submit" className="md:col-span-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Add Agency
                            </button>
                        </form>
                    </div>

                    {/* Agencies Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datasets</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {agencies.map(agency => (
                                    <tr key={agency.id}>
                                        <td className="px-6 py-4 font-medium">{agency.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{agency.location || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{agency.contact_info || '-'}</td>
                                        <td className="px-6 py-4">{agency.user_count}</td>
                                        <td className="px-6 py-4">{agency.dataset_count}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteAgency(agency.id, agency.name)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {agencies.length === 0 && (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No agencies found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 font-medium">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{user.agency_name || '-'}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex gap-4">
                        <select
                            value={logFilter}
                            onChange={(e) => setLogFilter(e.target.value)}
                            className="border rounded-lg px-4 py-2"
                        >
                            <option value="">All Actions</option>
                            <option value="login">Login</option>
                            <option value="upload">Upload</option>
                            <option value="train">Training</option>
                        </select>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Apply Filter
                        </button>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{log.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${log.action === 'login' ? 'bg-green-100 text-green-700' :
                                                log.action === 'upload' ? 'bg-blue-100 text-blue-700' :
                                                    log.action === 'train' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {log.details || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No activity logs found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;
