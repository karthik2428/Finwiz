import { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Target, Sparkles, Lock
} from 'lucide-react';
import {
    PieChart as RePieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import ProgressBar from '../components/common/ProgressBar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

export default function Goals() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [recModalOpen, setRecModalOpen] = useState(false);
    const [recLoadingId, setRecLoadingId] = useState(null);
    const [portfolio, setPortfolio] = useState(null);

    const isPremium = user?.premium?.isActive === true;

    const [formData, setFormData] = useState({
        title: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: ''
    });

    /* ---------------- FETCH GOALS ---------------- */
    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/goals');
            setGoals(res.data.goals || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    /* ---------------- SAVE GOAL ---------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const payload = {
            title: formData.title,
            targetAmount: Number(formData.targetAmount),
            currentAmount: Number(formData.currentAmount || 0),
            targetDate: formData.targetDate
        };

        try {
            if (editingGoal) {
                await api.put(`/goals/${editingGoal._id}`, payload);
            } else {
                await api.post('/goals', payload);
            }

            setIsModalOpen(false);
            setEditingGoal(null);
            setFormData({
                title: '',
                targetAmount: '',
                currentAmount: '',
                targetDate: ''
            });

            await fetchGoals();
        } finally {
            setFormLoading(false);
        }
    };

    const deleteGoal = async (goalId) => {
        if (!window.confirm("Delete this goal permanently?")) return;
        await api.delete(`/goals/${goalId}`);
        fetchGoals();
    };

    const getRecommendation = async (goal) => {
        setRecLoadingId(goal._id);
        try {
            const res = await api.get('/recommendations/mutual-funds', {
                params: { goalId: goal._id }
            });
            setPortfolio(res.data.portfolio);
            setRecModalOpen(true);
        } finally {
            setRecLoadingId(null);
        }
    };

    const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Financial Goals
                        </h1>
                        <p className="text-sm text-slate-500">
                            Goal-based portfolio recommendations
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setEditingGoal(null);
                            setFormData({
                                title: '',
                                targetAmount: '',
                                currentAmount: '',
                                targetDate: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> New Goal
                    </Button>
                </div>

                {/* GOALS GRID */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">
                        Loading goals...
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map(goal => {
                            const progress =
                                goal.targetAmount > 0
                                    ? (goal.currentAmount / goal.targetAmount) * 100
                                    : 0;

                            return (
                                <Card key={goal._id} className="relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary-500 to-indigo-500" />

                                    <div className="flex justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary-100">
                                                <Target className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">
                                                    {goal.title}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Target ₹{goal.targetAmount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Edit2
                                                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary-600"
                                                onClick={() => {
                                                    setEditingGoal(goal);
                                                    setFormData({
                                                        title: goal.title || '',
                                                        targetAmount: goal.targetAmount || '',
                                                        currentAmount: goal.currentAmount || '',
                                                        targetDate: goal.targetDate
                                                            ? goal.targetDate.split('T')[0]
                                                            : ''
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                            />
                                            <Trash2
                                                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500"
                                                onClick={() => deleteGoal(goal._id)}
                                            />
                                        </div>
                                    </div>

                                    <ProgressBar
                                        value={goal.currentAmount}
                                        max={goal.targetAmount}
                                        className="h-2"
                                    />

                                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                                        <span>
                                            ₹{goal.currentAmount.toLocaleString()} saved
                                        </span>
                                        <span>
                                            {progress.toFixed(0)}%
                                        </span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        disabled={!isPremium || recLoadingId === goal._id}
                                        className={`w-full mt-4 gap-2 transition-all duration-300 ${
                                            isPremium
                                                ? "bg-gradient-to-r from-primary-50 to-indigo-50 hover:from-primary-100 hover:to-indigo-100"
                                                : "bg-slate-100 cursor-not-allowed opacity-70"
                                        }`}
                                        onClick={() => {
                                            if (isPremium) {
                                                getRecommendation(goal);
                                            } else {
                                                navigate("/premium");
                                            }
                                        }}
                                        isLoading={recLoadingId === goal._id}
                                    >
                                        {isPremium ? (
                                            <>
                                                <Sparkles className="h-4 w-4 text-primary-600" />
                                                {recLoadingId === goal._id
                                                    ? "Analyzing..."
                                                    : "Smart Portfolio"}
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4 text-slate-400" />
                                                Premium Only
                                            </>
                                        )}
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* ADD / EDIT MODAL */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingGoal ? "Edit Goal" : "Create New Goal"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <Input
                            label="Title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />

                        <Input
                            label="Target Amount"
                            type="number"
                            value={formData.targetAmount}
                            onChange={(e) =>
                                setFormData({ ...formData, targetAmount: e.target.value })
                            }
                            required
                        />

                        <Input
                            label="Current Amount"
                            type="number"
                            value={formData.currentAmount}
                            onChange={(e) =>
                                setFormData({ ...formData, currentAmount: e.target.value })
                            }
                        />

                       <Input
    label="Target Date"
    type="date"
    value={formData.targetDate}
    onChange={(e) =>
        setFormData({ ...formData, targetDate: e.target.value })
    }
    min={getTomorrowDate()}
/>

                        <Button type="submit" isLoading={formLoading} className="w-full">
                            {editingGoal ? "Update Goal" : "Create Goal"}
                        </Button>

                    </form>
                </Modal>

                {/* FULL SMART PORTFOLIO MODAL */}
                <Modal
                    isOpen={recModalOpen}
                    onClose={() => setRecModalOpen(false)}
                    title="Recommended Portfolio"
                >
                    {!portfolio ? null : (
                        <div className="space-y-8">

                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            {portfolio.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Optimized for your goal timeline
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Expected Return</p>
                                        <p className="text-lg font-bold text-emerald-600">
                                            {portfolio.expectedReturn}% p.a.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-xs text-slate-500">Monthly SIP</p>
                                    <p className="text-3xl font-bold text-indigo-600">
                                        ₹{portfolio.totalMonthlySip.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border p-6">
                                <div className="h-64 relative">
                                    <ResponsiveContainer>
                                        <RePieChart>
                                            <Pie
                                                data={portfolio.funds}
                                                dataKey="allocationPercent"
                                                nameKey="fundName"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={3}
                                            >
                                                {portfolio.funds.map((_, idx) => (
                                                    <Cell
                                                        key={idx}
                                                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => `${v}%`} />
                                        </RePieChart>
                                    </ResponsiveContainer>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-slate-800">
                                            {portfolio.funds.length}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Funds
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {portfolio.funds.map((fund, idx) => (
                                    <div
                                        key={fund.schemeCode}
                                        className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold text-slate-800">
                                                    {fund.fundName}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    CAGR {fund.cagr}% • SIP ₹{fund.monthlySip.toLocaleString()}
                                                </p>
                                            </div>

                                            <span className="text-indigo-600 font-bold">
                                                {fund.allocationPercent}%
                                            </span>
                                        </div>

                                        <div className="w-full h-2 bg-slate-100 rounded-full">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${fund.allocationPercent}%`,
                                                    backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[11px] text-slate-400 text-center border-t pt-4">
                                Returns are market dependent. Past performance is not indicative of future results.
                            </p>

                        </div>
                    )}
                </Modal>

            </div>
        </DashboardLayout>
    );
}