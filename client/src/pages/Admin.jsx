import { useState, useEffect } from 'react';
import { Shield, Ban, CheckCircle, Search, Award, Activity, FileText, Settings, Server, DollarSign, Database } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // users, system, logs, config, news, payments, funds

    // Users State
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [userSearch, setUserSearch] = useState('');

    // System State
    const [systemStatus, setSystemStatus] = useState(null);
    const [loadingSystem, setLoadingSystem] = useState(false);

    // Logs State
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Config State
    const [config, setConfig] = useState({});
    const [loadingConfig, setLoadingConfig] = useState(false);

    // News State
    const [newsSettings, setNewsSettings] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);

    // Payments State
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    // Funds State
    const [funds, setFunds] = useState([]);
    const [loadingFunds, setLoadingFunds] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'admin') {
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'system') fetchSystem();
            if (activeTab === 'logs') fetchLogs();
            if (activeTab === 'config') fetchConfig();
            if (activeTab === 'news') fetchNewsSettings();
            if (activeTab === 'payments') fetchPayments();
            if (activeTab === 'funds') fetchFunds();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTab]);

    // --- Users Handlers ---
    const fetchUsers = async (page = 1) => {
        setLoadingUsers(true);
        try {
            const params = { page, limit: userPagination.limit, search: userSearch };
            const res = await api.get('/admin/users', { params });
            setUsers(res.data.users || []);
            setUserPagination(prev => ({ ...prev, page, total: res.data.meta?.total || 0 }));
        } catch (error) { console.error("Fetch users failed", error); }
        finally { setLoadingUsers(false); }
    };

    const handleBlock = async (id, isBlocked) => {
        if (!window.confirm(isBlocked ? "Unblock this user?" : "Block this user?")) return;
        try {
            await api.put(isBlocked ? `/admin/users/${id}/unblock` : `/admin/users/${id}/block`);
            fetchUsers(userPagination.page);
        } catch (error) { alert("Action failed"); }
    };

    const handlePremium = async (id, isPremium) => {
        if (!window.confirm(isPremium ? "Revoke premium?" : "Grant premium?")) return;
        try {
            await api.put(isPremium ? `/admin/users/${id}/premium-deactivate` : `/admin/users/${id}/premium-activate`);
            fetchUsers(userPagination.page);
        } catch (error) { alert("Action failed"); }
    };

    // --- System Handlers ---
    const fetchSystem = async () => {
        setLoadingSystem(true);
        try {
            const res = await api.get('/admin/system/status');
            setSystemStatus(res.data);
        } catch (error) { console.error("Fetch system failed", error); }
        finally { setLoadingSystem(false); }
    };

    // --- Logs Handlers ---
    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get('/admin/logs');
            setLogs(res.data.logs || []);
        } catch (error) { console.error("Fetch logs failed", error); }
        finally { setLoadingLogs(false); }
    };

    // --- Config Handlers ---
    const fetchConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await api.get('/admin/config');
            setConfig(res.data.config || {});
        } catch (error) { console.error("Fetch config failed", error); }
        finally { setLoadingConfig(false); }
    };

    const handleUpdateConfig = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/config', { config });
            alert("Configuration updated");
        } catch (error) { alert("Update failed"); }
    };

    // --- News Handlers ---
    const fetchNewsSettings = async () => {
        setLoadingNews(true);
        try {
            const res = await api.get('/admin/news/settings');
            setNewsSettings(res.data.settings || []);
        } catch (error) { console.error("Fetch news failed", error); }
        finally { setLoadingNews(false); }
    };

    const toggleNewsCategory = async (category, enabled) => {
        try {
            await api.put(`/admin/news/settings/${category}`, { enabled: !enabled });
            fetchNewsSettings();
        } catch (error) { alert("Failed to update news setting"); }
    };

    // --- Payments Handlers ---
    const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
            const res = await api.get('/admin/payments');
            setPayments(res.data.payments || []);
        } catch (error) { console.error("Fetch payments failed", error); }
        finally { setLoadingPayments(false); }
    };

    // --- Funds Handlers ---
    const fetchFunds = async () => {
        setLoadingFunds(true);
        try {
            const res = await api.get('/admin/funds');
            setFunds(res.data.funds || []);
        } catch (error) { console.error("Fetch funds failed", error); }
        finally { setLoadingFunds(false); }
    };

    const toggleFundVisibility = async (schemeCode, isHidden) => {
        try {
            await api.put(`/admin/funds/${schemeCode}`, { isHidden: !isHidden });
            fetchFunds();
        } catch (error) { alert("Failed to update fund"); }
    };

    const userColumns = [
        { header: 'User', accessor: 'name', render: (row) => <div><div className="font-medium text-slate-900">{row.name}</div><div className="text-xs text-slate-500">{row.email}</div></div> },
        { header: 'Role', accessor: 'role', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.role === 'admin' ? 'bg-purple-100 text-purple-800' : row.role === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>{row.role}</span> },
        { header: 'Status', accessor: 'isBlocked', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{row.isBlocked ? 'Blocked' : 'Active'}</span> },
        {
            header: 'Actions', accessor: 'actions', render: (row) => (
                <div className="flex gap-2">
                    {row.role !== 'admin' && (
                        <>
                            <button onClick={() => handlePremium(row._id, row.role === 'premium')} className="text-slate-400 hover:text-yellow-600"><Award className="h-4 w-4" /></button>
                            <button onClick={() => handleBlock(row._id, row.isBlocked)} className={`text-slate-400 ${row.isBlocked ? 'hover:text-green-600' : 'hover:text-red-600'}`}>{row.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</button>
                        </>
                    )}
                </div>
            )
        }
    ];

    if (user?.role !== 'admin') return null;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                    <Shield className="mr-2 h-6 w-6 text-primary-600" /> Admin Console
                </h1>

                {/* Tabs */}
                <div className="border-b border-slate-200 overflow-x-auto">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'users', label: 'Users', icon: <Search className="w-4 h-4 mr-2" /> },
                            { id: 'system', label: 'System Health', icon: <Activity className="w-4 h-4 mr-2" /> },
                            { id: 'logs', label: 'Logs', icon: <FileText className="w-4 h-4 mr-2" /> },
                            { id: 'config', label: 'Settings', icon: <Settings className="w-4 h-4 mr-2" /> },
                            { id: 'news', label: 'News', icon: <FileText className="w-4 h-4 mr-2" /> },
                            { id: 'payments', label: 'Payments', icon: <DollarSign className="w-4 h-4 mr-2" /> },
                            { id: 'funds', label: 'Funds', icon: <Database className="w-4 h-4 mr-2" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'users' && (
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
                            <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="max-w-xs bg-white" />
                            <Button onClick={() => fetchUsers(1)}>Search</Button>
                        </div>
                        <Table columns={userColumns} data={users} isLoading={loadingUsers} pagination={userPagination} onPageChange={fetchUsers} />
                    </Card>
                )}

                {activeTab === 'system' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-medium mb-4 flex items-center"><Server className="w-5 h-5 mr-2 text-indigo-500" /> Server Status</h3>
                            {loadingSystem ? <p>Loading...</p> : systemStatus ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2"><span>Uptime:</span> <span className="font-mono">{Math.floor(systemStatus.uptime / 60)} mins</span></div>
                                    <div className="flex justify-between border-b pb-2"><span>Memory Usage:</span> <span className="font-mono">{Math.floor(systemStatus.memoryUsage?.heapUsed / 1024 / 1024)} MB</span></div>
                                    <div className="flex justify-between border-b pb-2"><span>Platform:</span> <span className="font-mono">{systemStatus.platform}</span></div>
                                </div>
                            ) : <p className="text-slate-500">System status unavailable</p>}
                        </Card>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <Card>
                        <h3 className="text-lg font-medium mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-slate-500" /> System Logs</h3>
                        <div className="bg-slate-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-xs">
                            {loadingLogs ? "Loading logs..." : logs.length > 0 ? logs.map((log, i) => <div key={i}>{log}</div>) : "No logs found"}
                        </div>
                    </Card>
                )}

                {activeTab === 'config' && (
                    <Card>
                        <h3 className="text-lg font-medium mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-slate-500" /> System Configuration</h3>
                        {loadingConfig ? <p>Loading...</p> : (
                            <form onSubmit={handleUpdateConfig} className="space-y-4">
                                {Object.keys(config).map(key => (
                                    <Input key={key} label={key} value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} />
                                ))}
                                <Button type="submit">Save Configuration</Button>
                            </form>
                        )}
                    </Card>
                )}

                {activeTab === 'news' && (
                    <Card>
                        <h3 className="text-lg font-medium mb-4">News Categories</h3>
                        {loadingNews ? <p>Loading...</p> : (
                            <div className="space-y-4">
                                {newsSettings.map(s => (
                                    <div key={s._id} className="flex justify-between items-center border-b pb-2">
                                        <span className="capitalize font-medium">{s.category}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-500">Last fetched: {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleString() : 'Never'}</span>
                                            <Button size="sm" variant={s.enabled ? 'primary' : 'outline'} onClick={() => toggleNewsCategory(s.category, s.enabled)}>
                                                {s.enabled ? 'Enabled' : 'Disabled'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {activeTab === 'payments' && (
                    <Card>
                        <h3 className="text-lg font-medium mb-4">Payment Logs</h3>
                        {loadingPayments ? <p>Loading...</p> : (
                            <div className="max-h-96 overflow-y-auto">
                                <Table
                                    columns={[
                                        { header: 'Order ID', accessor: 'orderId' },
                                        { header: 'Amount', accessor: 'amount' },
                                        { header: 'Status', accessor: 'status' },
                                        { header: 'Date', accessor: 'createdAt', render: r => new Date(r.createdAt).toLocaleDateString() }
                                    ]}
                                    data={payments}
                                />
                            </div>
                        )}
                    </Card>
                )}

                {activeTab === 'funds' && (
                    <Card>
                        <h3 className="text-lg font-medium mb-4">Mutual Funds Registry</h3>
                        {loadingFunds ? <p>Loading...</p> : (
                            <div className="max-h-96 overflow-y-auto">
                                <Table
                                    columns={[
                                        { header: 'Scheme Name', accessor: 'schemeName' },
                                        { header: 'Category', accessor: 'schemeCategory' },
                                        { header: 'Visibility', accessor: 'hidden', render: r => r.isHidden ? 'Hidden' : 'Visible' },
                                        { header: 'Action', accessor: 'action', render: r => <Button size="xs" onClick={() => toggleFundVisibility(r.schemeCode, r.isHidden)}>{r.isHidden ? 'Unhide' : 'Hide'}</Button> }
                                    ]}
                                    data={funds}
                                />
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
