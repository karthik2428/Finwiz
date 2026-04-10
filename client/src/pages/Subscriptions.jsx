import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2, Zap, Receipt } from 'lucide-react';
import { cn } from '../utils/cn';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import api from '../services/api';

export default function Subscriptions() {

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        avgAmount: '',
        recurrenceDays: 30,
        estimatedNextDate: '',
        type: 'subscription'
    });

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/subscriptions');
            setSubscriptions(res.data.subscriptions || []);
        } catch (error) {
            console.error("Failed to fetch subscriptions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleScan = async () => {
        setScanning(true);

        try {
            const res = await api.post('/subscriptions/scan');

            alert(`Scan complete. Found ${res.data.detectedCount || 0} recurring payments.`);

            fetchSubscriptions();
        } catch (error) {
            console.error("Scan failed", error);
            alert("Failed to scan subscriptions");
        } finally {
            setScanning(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this item?")) return;

        try {
            await api.delete(`/subscriptions/${id}`);
            fetchSubscriptions();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            await api.put(`/subscriptions/${editingSub._id}`, formData);

            setIsModalOpen(false);
            setEditingSub(null);

            fetchSubscriptions();
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setFormLoading(false);
        }
    };

    const openEdit = (sub) => {

        setEditingSub(sub);

        const dateStr = sub.estimatedNextDate
            ? new Date(sub.estimatedNextDate).toISOString().split('T')[0]
            : '';

        setFormData({
            title: sub.title,
            avgAmount: sub.avgAmount || '',
            recurrenceDays: sub.recurrenceDays || 30,
            estimatedNextDate: dateStr,
            type: sub.type || 'subscription'
        });

        setIsModalOpen(true);
    };

    return (
        <DashboardLayout>

            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex justify-between items-center">

                    <h1 className="text-2xl font-bold text-slate-900">
                        Subscriptions & Bills
                    </h1>

                    <Button onClick={handleScan} isLoading={scanning} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Scan for Recurring Payments
                    </Button>

                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>

                ) : subscriptions.length === 0 ? (

                    <Card className="text-center py-16">

                        <div className="text-slate-500 mb-4">
                            No recurring payments detected.
                        </div>

                        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                            We analyze your transactions to detect subscriptions and bills automatically.
                        </p>

                        <Button onClick={handleScan}>
                            Run Scan Now
                        </Button>

                    </Card>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {subscriptions.map((sub) => {

                            const renewal = sub.estimatedNextDate
                                ? new Date(sub.estimatedNextDate)
                                : new Date();

                            const daysToRenewal =
                                Math.ceil((renewal - new Date()) / (1000 * 60 * 60 * 24));

                            const freqText =
                                sub.recurrenceDays >= 360
                                    ? "Yearly"
                                    : sub.recurrenceDays >= 28
                                        ? "Monthly"
                                        : sub.recurrenceDays >= 7
                                            ? "Weekly"
                                            : "Daily";

                            const isBill = sub.type === "bill";

                            return (

                                <Card
                                    key={sub._id}
                                    className={cn(
                                        "relative border-l-4",
                                        isBill
                                            ? "border-l-orange-500"
                                            : "border-l-indigo-500"
                                    )}
                                >

                                    <div className="flex justify-between items-start mb-4">

                                        <div className="flex items-center gap-3">

                                            <div
                                                className={cn(
                                                    "p-2 rounded-lg",
                                                    isBill
                                                        ? "bg-orange-100"
                                                        : "bg-indigo-100"
                                                )}
                                            >
                                                {isBill ? (
                                                    <Receipt className="h-5 w-5 text-orange-600" />
                                                ) : (
                                                    <Zap className="h-5 w-5 text-indigo-600" />
                                                )}
                                            </div>

                                            <div>

                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {sub.title}
                                                </h3>

                                                <p className="text-sm text-slate-500 capitalize">
                                                    {sub.type || "subscription"} • {freqText}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex gap-1">

                                            <button
                                                onClick={() => openEdit(sub)}
                                                className="p-1 text-slate-400 hover:text-primary-600"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(sub._id)}
                                                className="p-1 text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>

                                        </div>

                                    </div>

                                    <div className="flex justify-between items-end">

                                        <div>

                                            <div className="text-2xl font-bold text-slate-900">
                                                ₹{Number(sub.avgAmount || 0).toFixed(0)}
                                            </div>

                                            <div className="text-xs text-slate-500 mt-1">
                                                Renews {renewal.toLocaleDateString()}
                                            </div>

                                        </div>

                                        <div
                                            className={cn(
                                                "text-xs font-medium px-2 py-1 rounded-full",
                                                daysToRenewal <= 3
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-green-100 text-green-700"
                                            )}
                                        >
                                            {daysToRenewal <= 0
                                                ? "Due Today"
                                                : `${daysToRenewal} days left`}
                                        </div>

                                    </div>

                                </Card>

                            );

                        })}

                    </div>

                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Edit Subscription / Bill"
                >

                    <form onSubmit={handleUpdate} className="space-y-4">

                        <Input
                            label="Title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />

                        <Input
                            type="number"
                            label="Amount"
                            value={formData.avgAmount}
                            onChange={(e) =>
                                setFormData({ ...formData, avgAmount: e.target.value })
                            }
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Type
                                </label>

                                <select
                                    className="block w-full border-slate-300 rounded-md"
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value })
                                    }
                                >
                                    <option value="subscription">Subscription</option>
                                    <option value="bill">Bill</option>
                                </select>

                            </div>

                            <Input
                                type="date"
                                label="Next Renewal"
                                value={formData.estimatedNextDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        estimatedNextDate: e.target.value
                                    })
                                }
                            />

                        </div>

                        <div className="flex justify-end gap-3 pt-4">

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" isLoading={formLoading}>
                                Save Changes
                            </Button>

                        </div>

                    </form>

                </Modal>

            </div>

        </DashboardLayout>
    );
}