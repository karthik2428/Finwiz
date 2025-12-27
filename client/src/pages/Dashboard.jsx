import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import api from '../services/api';
import { getBasicAnalytics } from '../services/analytics';
import { Loader, Wallet, CreditCard, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Widgets
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [subSummary, setSubSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [forecast, setForecast] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);

        const [
          summaryRes,
          analyticsData,
          recentRes,
          budgetRes,
          subRes,
          goalsListRes
        ] = await Promise.all([
          api.get('/transactions/summary'),
          getBasicAnalytics(),
          api.get('/transactions', { params: { limit: 5 } }),
          api
            .get('/budget/summary', { params: { month: currentMonth } })
            .catch(() => ({ data: { summary: [] } })),
          api
            .get('/subscriptions/summary')
            .catch(() => ({ data: { totalMonthly: 0, count: 0 } })),
          api.get('/goals')
        ]);

        setSummary(summaryRes.data.summary);
        setAnalytics(analyticsData);
        setRecentTransactions(recentRes.data.transactions || []);
        setBudgetSummary(budgetRes.data.summary || []);
        setSubSummary(subRes.data);

        // Goal summaries
        const goalSummaries = await Promise.all(
          (goalsListRes.data.goals || []).map(async (g) => {
            const res = await api.get(`/goals/${g._id}/summary`);
            return {
              _id: g._id,
              title: g.title,
              targetAmount: g.targetAmount,
              currentSaved: res.data.currentSaved,
              progressPct: res.data.progressPct
            };
          })
        );

        setGoals(goalSummaries);
      } catch (error) {
        console.error('Dashboard fetch failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Charts data
  const monthlyData = [];
  if (analytics) {
    const incomeMonths = Object.keys(analytics.monthlyIncome || {});
    const expenseMonths = Object.keys(analytics.monthlyExpense || {});
    const allMonths = Array.from(new Set([...incomeMonths, ...expenseMonths])).sort();

    allMonths.forEach((m) => {
      monthlyData.push({
        name: m,
        Income: analytics.monthlyIncome?.[m] || 0,
        Expense: analytics.monthlyExpense?.[m] || 0
      });
    });
  }

  const categoryData =
    analytics?.categoryBreakdown?.map((c) => ({
      name: c._id,
      value: c.total
    })) || [];

  const forecastData =
    forecast?.savingsForecast?.map((val, idx) => ({
      name: `Month ${idx + 1}`,
      Savings: val
    })) || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {!user?.isPremium && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
                Unlock Your Financial Potential
              </h2>
              <p className="text-indigo-100 mt-1">
                Get AI-powered savings forecasts, smart investment recommendations,
                and monthly reports.
              </p>
            </div>
            <Button
              className="bg-white text-indigo-600 hover:bg-indigo-50 border-none px-6 py-2 rounded-full font-bold shadow-md whitespace-nowrap"
              onClick={() => navigate('/premium')}
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('http://localhost:5000/report/monthly', '_blank')}
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!window.confirm('Send monthly report to your email?')) return;
                try {
                  alert('Generating and sending email...');
                  await api.post('/report/send-email');
                  alert('Email sent successfully!');
                } catch (err) {
                  console.error('Email failed', err);
                  alert('Failed to send email. Please try again.');
                }
              }}
            >
              Email Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary-500">
            <dt className="text-sm font-medium text-slate-500 truncate">
              Current Balance (Est.)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">
              ₹{((summary?.income || 0) - (summary?.expense || 0)).toLocaleString()}
            </dd>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <dt className="text-sm font-medium text-slate-500 truncate">
              Income (Last 30 Days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              ₹{summary?.income?.toLocaleString() || '0'}
            </dd>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <dt className="text-sm font-medium text-slate-500 truncate">
              Expenses (Last 30 Days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              ₹{summary?.expense?.toLocaleString() || '0'}
            </dd>
          </Card>
        </div>

        {/* Widgets Row (Budget, Subs, Goals) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Budget */}
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center">
                <Wallet className="w-4 h-4 mr-2" /> Budget
              </h3>
              <button
                onClick={() => navigate('/budget')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Manage
              </button>
            </div>

            {budgetSummary.length > 0 ? (
              <div className="space-y-4">
                {budgetSummary.slice(0, 3).map((b) => (
                  <div key={b._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate">{b.category}</span>
                      <span
                        className={
                          b.alert === 'limit_reached'
                            ? 'text-red-600 font-bold'
                            : b.alert === 'near_limit'
                            ? 'text-yellow-600 font-bold'
                            : 'text-slate-500'
                        }
                      >
                        {Math.round(b.percentUsed)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          b.alert === 'limit_reached'
                            ? 'bg-red-500'
                            : b.alert === 'near_limit'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No budgets set.
              </div>
            )}
          </Card>

          {/* Subscriptions */}
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center">
                <CreditCard className="w-4 h-4 mr-2" /> Subscriptions
              </h3>
              <button
                onClick={() => navigate('/subscriptions')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View
              </button>
            </div>

            <div className="flex flex-col justify-center h-32">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                ₹{subSummary?.totalMonthly?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-slate-500 mb-4">Total Monthly Cost</div>
              <div className="flex items-center gap-2 text-xs bg-slate-100 p-2 rounded-md">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{subSummary?.count || 0} Active Subscriptions</span>
              </div>
            </div>
          </Card>

          {/* Goals */}
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center">
                <Target className="w-4 h-4 mr-2" /> Goals
              </h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Track
              </button>
            </div>

            {Array.isArray(goals) && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((g) => (
                  <div key={g._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate">{g.title}</span>
                      <span className="text-slate-600 font-medium">
                        {Math.max(1, Math.round(g.progressPct))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, g.progressPct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No goals active.
              </div>
            )}
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-96">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              {user?.isPremium
                ? 'Income vs Expense (with Forecast)'
                : 'Income vs Expense Trend'}
            </h3>

            <div className="h-80 min-h-[320px] min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    user?.isPremium && forecastData.length > 0
                      ? forecastData
                      : monthlyData
                  }
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    {user?.isPremium && (
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    )}
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip />

                  {user?.isPremium && forecastData.length > 0 ? (
                    <Area
                      type="monotone"
                      dataKey="Savings"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="url(#colorSavings)"
                      name="Projected Savings"
                    />
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Income"
                        stroke="#10b981"
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Expense"
                        stroke="#ef4444"
                        fill="url(#colorExpense)"
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {!user?.isPremium && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => navigate('/premium')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Upgrade to Premium to see future savings forecast
                </button>
              </div>
            )}
          </Card>

          {/* Category Pie */}
          <Card className="h-96">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Spending by Category
            </h3>

            <div className="h-80 min-h-[320px] min-w-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No expense data available
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        {/* Recent Transactions */}
<Card className="overflow-hidden">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-slate-900">
      Recent Transactions
    </h3>
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/transactions')}
      className="text-xs"
    >
      View All
    </Button>
  </div>

  {recentTransactions.length === 0 ? (
    <div className="text-center py-10 text-slate-400 text-sm">
      No recent transactions yet
    </div>
  ) : (
    <div className="space-y-3">
      {recentTransactions.map((tx) => {
        const isIncome = tx.kind === 'income';

        return (
          <div
            key={tx._id || tx.id}
            className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white transition-all duration-200"
          >
            {/* Left: Icon + Info */}
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}
              >
                {isIncome ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 13l-5 5m0 0l-5-5m5 5V6"
                    />
                  </svg>
                )}
              </div>

              <div>
                <p className="font-medium text-slate-900 leading-tight">
                  {tx.description || tx.category}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                  {tx.category && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-[2px] rounded-full bg-slate-200 text-slate-600">
                        {tx.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Amount */}
            <div
              className={`font-semibold text-sm px-3 py-1 rounded-full 
                ${isIncome
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'}`}
            >
              {isIncome ? '+' : '-'}₹
              {Math.abs(tx.amount).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  )}
</Card>

      </div>
    </DashboardLayout>
  );
}
