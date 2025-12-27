import { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Target, Sparkles, PieChart
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

const PIE_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Recommendation
    const [recModalOpen, setRecModalOpen] = useState(false);
    const [recLoadingId, setRecLoadingId] = useState(null);
    const [portfolio, setPortfolio] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: ''
    });

    /* ---------------- FETCH GOALS ---------------- */
    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data.goals || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

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
            editingGoal
                ? await api.put(`/goals/${editingGoal._id}`, payload)
                : await api.post('/goals', payload);

            setIsModalOpen(false);
            setEditingGoal(null);
            fetchGoals();
        } finally {
            setFormLoading(false);
        }
    };

    /* ---------------- DELETE GOAL ---------------- */
    const deleteGoal = async (goalId) => {
        if (!window.confirm("Delete this goal permanently?")) return;
        await api.delete(`/goals/${goalId}`);
        fetchGoals();
    };

    /* ---------------- GET PORTFOLIO ---------------- */
    const getRecommendation = async (goal) => {
        setRecLoadingId(goal._id);

        try {
            const res = await api.get('/recommendations/mutual-funds', {
                params: { goalId: goal._id }
            });
            setPortfolio(res.data.portfolio);
            setRecModalOpen(true); // ✅ open only AFTER data arrives
        } finally {
            setRecLoadingId(null);
        }
    };

    const allocationColor = (type) => {
        if (!type) return "bg-slate-100";
        if (type.includes("small")) return "bg-rose-100";
        if (type.includes("mid")) return "bg-amber-100";
        return "bg-emerald-100";
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
                            Goal-based AI portfolio recommendations
                        </p>
                    </div>

                    <Button onClick={() => setIsModalOpen(true)} className="gap-2">
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
                                (goal.currentSaved / goal.targetAmount) * 100;

                            return (
                                <Card key={goal._id} className="relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary-500 to-indigo-500" />

                                    <div className="flex justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary-100">
                                                <Target className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{goal.title}</h3>
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
                                                    setFormData(goal);
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
                                        value={goal.currentSaved}
                                        max={goal.targetAmount}
                                        className="h-2"
                                    />

                                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                                        <span>₹{goal.currentSaved.toLocaleString()} saved</span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4 gap-2 bg-gradient-to-r from-primary-50 to-indigo-50"
                                        onClick={() => getRecommendation(goal)}
                                        isLoading={recLoadingId === goal._id}
                                    >
                                        <Sparkles className="h-4 w-4 text-primary-600" />
                                        {recLoadingId === goal._id
                                            ? "Analyzing your goal…"
                                            : "Smart Portfolio"}
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* GOAL MODAL */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingGoal ? "Edit Goal" : "New Goal"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Goal Title" required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })} />

                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" label="Target Amount" required
                                value={formData.targetAmount}
                                onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} />
                            <Input type="date" label="Target Date" required
                                value={formData.targetDate}
                                onChange={e => setFormData({ ...formData, targetDate: e.target.value })} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={formLoading}>
                                Save Goal
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* PORTFOLIO MODAL */}
                <Modal
                    isOpen={recModalOpen}
                    onClose={() => setRecModalOpen(false)}
                    title="Recommended Portfolio"
                >
                    {!portfolio ? null : (
                        <div className="space-y-6">

                            {/* Portfolio Header */}
                            <div className="p-4 rounded-lg bg-slate-50">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-primary-600" />
                                    {portfolio.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Expected Return ~ {portfolio.expectedReturn}% p.a.
                                </p>
                                <p className="mt-2 text-lg font-bold text-primary-600">
                                    Monthly SIP: ₹{portfolio.totalMonthlySip.toLocaleString()}
                                </p>
                            </div>

                            {/* Pie Chart */}
                            <div className="border rounded-xl p-4">
                                <div className="h-56">
                                    <ResponsiveContainer>
                                        <RePieChart>
                                            <Pie
                                                data={portfolio.funds}
                                                dataKey="allocationPercent"
                                                nameKey="fundName"
                                                innerRadius={55}
                                                outerRadius={85}
                                            >
                                                {portfolio.funds.map((_, idx) => (
                                                    <Cell
                                                        key={idx}
                                                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={v => `${v}% allocation`} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Fund Cards */}
                            {portfolio.funds.map((fund, idx) => (
                                <div key={fund.schemeCode} className="border rounded-xl p-4">
                                    <div className="flex justify-between">
                                        <h4 className="font-semibold">{fund.fundName}</h4>
                                        <span className={`text-xs px-2 py-1 rounded ${allocationColor(fund.type)}`}>
                                            {fund.allocationPercent}%
                                        </span>
                                    </div>
                                    <div className="text-xs mt-2 text-slate-600">
                                        SIP: ₹{fund.monthlySip.toLocaleString()} | CAGR: {fund.cagr}%
                                    </div>
                                </div>
                            ))}

                            <p className="text-[11px] text-slate-400">
                                Portfolio is diversified to manage risk. Returns are not guaranteed.
                            </p>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
