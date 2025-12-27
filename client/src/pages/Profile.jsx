import { useState, useEffect } from 'react';
import { User, Shield, Key, Save } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [riskAnswers, setRiskAnswers] = useState({ q1: '', q2: '', q3: '' }); // Simplified
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({ name: user.name, email: user.email });
            // Fetch current risk answers if available in profile endpoint
            // Assuming user object has it or separate fetch
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/profile', profile);
            alert("Profile updated!");
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRisk = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/risk-answers', { riskAnswers }); // Adjust payload structure based on backend
            alert("Risk profile updated!");
        } catch (error) {
            console.error("Risk update failed", error);
            alert("Failed to update risk profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="text-center p-6">
                            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-slate-400">
                                <User />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 uppercase">
                                {user?.role === 'premium' ? 'Premium Member' : user?.role === 'admin' ? 'Administrator' : 'Free Plan'}
                            </div>
                        </Card>
                    </div>

                    {/* Settings Forms */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                                <User className="mr-2 h-5 w-5 text-primary-500" /> Personal Information
                            </h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                                <Input
                                    label="Email"
                                    value={profile.email}
                                    disabled
                                    className="bg-slate-50 cursor-not-allowed"
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" isLoading={loading} className="gap-2">
                                        <Save className="h-4 w-4" /> Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-green-500" /> Investment Risk Profile
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Help us tailor mutual fund recommendations by answering a few questions.
                            </p>
                            <form onSubmit={handleUpdateRisk} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">What is your investment goal duration?</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 bg-white"
                                        value={riskAnswers.q1}
                                        onChange={(e) => setRiskAnswers({ ...riskAnswers, q1: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        <option value="short">Short Term (1-3 Years)</option>
                                        <option value="medium">Medium Term (3-7 Years)</option>
                                        <option value="long">Long Term (7+ Years)</option>
                                    </select>
                                </div>

                                {/* More questions can be added similarly */}

                                <div className="flex justify-end">
                                    <Button type="submit" isLoading={loading} variant="outline" className="gap-2">
                                        <Save className="h-4 w-4" /> Update Risk Profile
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
