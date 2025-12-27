import { useState, useEffect } from 'react';
import { TrendingUp, Medal, AlertCircle, Award, FileText, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import MathExplainer from '../components/common/MathExplainer';
import api from '../services/api';
import { getPremiumAnalytics } from '../services/analytics';
import { getForecastSavings, compareForecast } from '../services/forecast';
import { useAuth } from '../context/AuthContext';

export default function Premium() {
    const { user } = useAuth();
    const [forecast, setForecast] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [recGoal, setRecGoal] = useState(null);
    const [premiumAnalytics, setPremiumAnalytics] = useState(null);
    const [forecastComparison, setForecastComparison] = useState(null);
    const [priceCreeps, setPriceCreeps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [forecastData, analyticsData, compareData, subRes, goalsRes] = await Promise.all([
                    getForecastSavings().catch(err => null),
                    getPremiumAnalytics().catch(err => null),
                    compareForecast().catch(err => null),
                    api.get('/subscriptions/summary').catch(() => ({ data: { priceCreeps: [] } })),
                    api.get('/goals').catch(() => ({ data: { goals: [] } }))
                ]);

                if (forecastData) setForecast(forecastData);
                if (analyticsData) setPremiumAnalytics(analyticsData);
                if (compareData) setForecastComparison(compareData);
                if (subRes?.data?.priceCreeps) setPriceCreeps(subRes.data.priceCreeps);

                const goals = goalsRes.data.goals || [];
                if (goals.length > 0) {
                    const targetGoal = goals[0];
                    setRecGoal(targetGoal);
                    const recRes = await api.get('/recommendations/mutual-funds', { params: { goalId: targetGoal._id } }).catch(() => null);
                    if (recRes?.data?.recommendations) {
                        setRecommendations(recRes.data.recommendations);
                    }
                }
            } catch (error) {
                console.error("Premium data fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        const res = await loadRazorpay();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const orderRes = await api.post('/payment/order', { plan: 'monthly' });
            const { orderId, currency, amount } = orderRes.data;

            if (!orderId) {
                alert("Order creation failed");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount,
                currency,
                name: "FinWiz Premium",
                description: "Upgrade to FinWiz Premium",
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verify', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        });
                        alert("Payment Successful! You are now a Premium member.");
                        window.location.reload();
                    } catch (error) {
                        console.error("Verification failed", error);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#f59e0b"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error("Payment initiation failed", error);
            alert("Could not initiate payment. Please try again.");
        }
    };

    // Transform forecast series array into chart-compatible format
    const forecastChartData = forecast?.series ? [
        ...forecast.series.map((val, idx) => ({
            name: `M${idx + 1}`,
            Savings: val
        })),
        {
            name: 'Forecast',
            Savings: forecast.forecastScenarios?.base,
            Optimistic: forecast.forecastScenarios?.optimistic,
            Pessimistic: forecast.forecastScenarios?.pessimistic
        }
    ] : [];

    const isPremium = user?.isPremium;

    return (
        <DashboardLayout>
            <div className="relative">
                {!isPremium && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white/90 backdrop-blur-sm border border-yellow-200 rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
                            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg animate-bounce">
                                <Medal />
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Unlock Premium Intelligence</h1>
                            <p className="text-xl text-slate-600 mb-8">
                                You are viewing a preview. Get access to AI-free advanced mathematical forecasting, smart mutual fund recommendations, and detailed analytics.
                            </p>
                            <Button
                                size="lg"
                                onClick={handlePayment}
                                className="rounded-full px-10 py-4 text-lg bg-yellow-500 hover:bg-yellow-600 border-none shadow-lg transform hover:scale-105 transition-all w-full md:w-auto"
                            >
                                Upgrade Now (₹99/mo)
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`max-w-7xl mx-auto space-y-8 transition-all duration-300 ${!isPremium ? 'blur-md opacity-50 select-none pointer-events-none h-[calc(100vh-100px)] overflow-hidden' : ''}`}>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Award className="text-yellow-500 h-8 w-8" /> Premium Insights
                    </h1>

                    {premiumAnalytics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none overflow-visible">
                                <div className="flex items-center gap-1 text-sm font-medium text-white/80 uppercase">
                                    Financial Efficiency
                                    <MathExplainer term="Financial Efficiency" position="bottom" />
                                </div>
                                <div className="mt-2 text-4xl font-bold text-white">
                                    {premiumAnalytics.efficiencyScore}/100
                                </div>
                                <p className="text-white/80 text-xs mt-1">Based on your savings ratio formula</p>
                            </Card>

                            <Card className="overflow-visible">
                                <div className="flex items-center gap-1 text-sm font-medium text-slate-500 uppercase">
                                    Avg Monthly Savings
                                    <MathExplainer term="Avg Monthly Savings" position="bottom" />
                                </div>
                                <div className={`mt-2 text-3xl font-semibold ${premiumAnalytics?.avgSavings >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                    ₹{premiumAnalytics?.avgSavings?.toLocaleString()}
                                </div>
                            </Card>

                            <Card className="overflow-visible">
                                <dt className="flex items-center gap-1 text-sm font-medium text-slate-500 uppercase">
                                    Forecast Accuracy
                                    <MathExplainer term="Forecast Accuracy" position="bottom" />
                                </dt>
                                <dd className={`mt-2 text-3xl font-semibold ${premiumAnalytics?.forecastComparison?.differencePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {premiumAnalytics?.forecastComparison?.differencePct > 0 ? '+' : ''}
                                    {premiumAnalytics?.forecastComparison?.differencePct}%
                                </dd>
                                <div className={`text-xs font-medium uppercase mt-1 ${premiumAnalytics?.forecastComparison?.differencePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {premiumAnalytics?.forecastComparison?.differencePct >= 0 ? 'Beating Forecast' : 'Missed Forecast'}
                                </div>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 min-h-[400px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center">
                                        Savings Forecast (Next 3 Months)
                                        <MathExplainer term="Optimistic Scenario" customText="3 scenarios: Optimistic (+10%), Base (WMA), Pessimistic (-10%) to plan for uncertainty." />
                                    </h3>
                                    {forecast?.insight && (
                                        <p className="text-sm text-slate-500 mt-1 max-w-xl">
                                            💡 {forecast.insight}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastChartData}>
                                        <defs>
                                            <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                        <Tooltip formatter={(val, name) => [`₹${val}`, name]} />
                                        <Area type="monotone" dataKey="Optimistic" stroke="#10b981" strokeDasharray="5 5" fill="url(#colorOptimistic)" name="Optimistic" />
                                        <Area type="monotone" dataKey="Pessimistic" stroke="#ef4444" strokeDasharray="5 5" fill="url(#colorPessimistic)" name="Pessimistic" />
                                        <Area type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={3} fillOpacity={0.2} fill="#6366f1" name="Base Forecast" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <Card className={`border-l-4 ${priceCreeps.length > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                                    {priceCreeps.length > 0 ? <AlertTriangle className="w-5 h-5 text-red-500 mr-2" /> : <TrendingUp className="w-5 h-5 text-green-500 mr-2" />}
                                    Subscription Intelligence
                                </h3>
                                {priceCreeps.length > 0 ? (
                                    <div>
                                        <p className="text-sm text-slate-600 mb-3">
                                            We detected <strong>{priceCreeps.length}</strong> subscription(s) with increasing costs.
                                        </p>
                                        <div className="space-y-2">
                                            {priceCreeps.map((pc, i) => (
                                                <div key={i} className="text-xs flex justify-between bg-red-50 p-2 rounded text-red-700">
                                                    <span className="font-medium">{pc.title}</span>
                                                    <span>+{Math.round(pc.priceCreep.avgIncrease)}% avg increase</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">
                                        No price creeps detected. Your recurring payments are stable.
                                    </p>
                                )}
                            </Card>

                            <Card>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                                    <FileText className="w-5 h-5 text-indigo-500 mr-2" /> Monthly Report
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Generate a comprehensive PDF report of your financial health, including forecasts and recommendations.
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => window.open(`http://localhost:5000/report/monthly`, '_blank')}>Download PDF</Button>
                                    <Button size="sm" variant="outline" onClick={async () => {
                                        if (confirm("Send report to email?")) {
                                            await api.post('/report/send-email');
                                            alert("Sent!");
                                        }
                                    }}>Email Me</Button>
                                </div>
                            </Card>

                            <Card className="h-full border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                            <Zap className="w-5 h-5 text-yellow-500 mr-2" /> Smart Recommendations
                                        </h3>
                                        {recGoal ? (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Tailored for goal: <span className="font-medium text-slate-700">{recGoal.title}</span> ({recGoal.durationMonths}m, {recGoal.riskCategory} risk)
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500 mt-1">Create a goal to get AI-free math-based mutual fund suggestions.</p>
                                        )}
                                    </div>
                                </div>

                                {recGoal && recommendations.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendations.slice(0, 3).map((rec, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-sm">{rec.fundName}</div>
                                                    <div className="text-xs text-slate-500 capitalize">{rec.type.replace('_', ' ')} Fund</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-green-600 text-sm">{rec.cagr}% CAGR</div>
                                                    <div className="text-[10px] text-slate-400">Est. SIP: ₹{Math.round(rec.estimatedSIP).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.href = '/goals'}>
                                            View Detailed Analysis <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        {recGoal ? "No matching funds found." : "Add a goal to unlock recommendations."}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
