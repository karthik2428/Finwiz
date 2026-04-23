import { useEffect, useState } from "react";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Premium() {
  const { user } = useAuth() || {};

  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const isPremium = user?.premium?.isActive === true;

  useEffect(() => {
    async function loadForecast() {
      try {
        const res = await api.get("/forecast/savings");
        setForecast(res.data);
      } catch (err) {
        console.error("Forecast error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  // ------------------ RAZORPAY SCRIPT LOADER ------------------

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ------------------ PAYMENT HANDLER ------------------

  const handlePayment = async () => {
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const orderRes = await api.post("/payment/order", {
        plan: selectedPlan,
      });

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
        description:
          selectedPlan === "monthly"
            ? "FinWiz Premium - Monthly Plan"
            : "FinWiz Premium - Yearly Plan",
        order_id: orderId,
        handler: async function (response) {
          try {
            await api.post("/payment/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            alert("Payment Successful! You are now a Premium member.");
            window.location.reload();
          } catch (error) {
            console.error("Verification failed", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#6366f1",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment initiation failed", error);
      alert("Could not initiate payment. Please try again.");
    }
  };

  // ------------------ FORECAST DATA ------------------

  const chartData =
    forecast?.series?.map((value, index) => ({
      name: `Month ${index + 1}`,
      Savings: value,
    })) || [];

  const trendIcon =
    forecast?.trend?.direction === "up" ? (
      <TrendingUp className="text-emerald-500" />
    ) : forecast?.trend?.direction === "down" ? (
      <TrendingDown className="text-red-500" />
    ) : (
      <Minus className="text-slate-500" />
    );

  return (
    <DashboardLayout>
      <div className="relative max-w-7xl mx-auto space-y-6 md:space-y-12 pb-8 md:pb-16 px-4 sm:px-6 lg:px-8">

        {/* LOCK OVERLAY */}
        {!isPremium && (
          <div className="fixed inset-0 z-50 flex justify-center items-start pt-16 md:pt-24 bg-white/80 backdrop-blur px-4">
            <Card className="p-4 sm:p-6 md:p-8 text-center max-w-md w-full mx-auto shadow-xl">
              <h2 className="text-xl sm:text-2xl font-bold mb-3">
                Unlock Premium Forecast
              </h2>

              <p className="text-slate-500 mb-6 text-sm sm:text-base">
                Get intelligent 90-day projections and financial insights.
              </p>

              {/* PLAN SELECTOR */}
              <div className="flex justify-center mb-6">
                <div className="flex gap-3 sm:gap-4 w-full max-w-sm">
                  <button
                    onClick={() => setSelectedPlan("monthly")}
                    className={`flex-1 p-3 sm:p-4 rounded-xl border transition text-center ${
                      selectedPlan === "monthly"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    <div className="font-bold text-base sm:text-lg">₹99</div>
                    <div className="text-xs sm:text-sm">Monthly</div>
                  </button>

                  <button
                    onClick={() => setSelectedPlan("yearly")}
                    className={`flex-1 p-3 sm:p-4 rounded-xl border transition relative text-center ${
                      selectedPlan === "yearly"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs bg-emerald-500 text-white px-2 sm:px-3 py-1 rounded-full shadow whitespace-nowrap">
                      Save ₹189
                    </div>

                    <div className="font-bold text-base sm:text-lg">₹999</div>
                    <div className="text-xs sm:text-sm">Yearly</div>
                  </button>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full sm:w-auto">
                Upgrade to{" "}
                {selectedPlan === "monthly"
                  ? "₹99/month"
                  : "₹999/year"}
              </Button>
            </Card>
          </div>
        )}

        <div className={`${!isPremium ? "blur-sm pointer-events-none" : ""}`}>

          {/* HEADER */}
          <section className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 flex-wrap">
              <Award className="h-6 w-6 sm:h-8 sm:w-8" />
              90-Day Savings Projection
            </h1>

            <p className="mt-2 sm:mt-3 text-indigo-100 max-w-2xl text-sm sm:text-base">
              We analyze your last 6 months of savings and estimate how your
              savings may grow if your current financial habits continue.
            </p>

            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-indigo-200">
              {forecast?.insight}
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-10">
            <Card className="p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-slate-500 uppercase">Likely Next Month</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2 break-words">
                ₹{forecast?.forecastScenarios?.base?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-slate-500 uppercase">Best Case</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2 break-words">
                ₹{forecast?.forecastScenarios?.optimistic?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-slate-500 uppercase">Worst Case</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-500 mt-2 break-words">
                ₹{forecast?.forecastScenarios?.pessimistic?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-slate-500 uppercase">Inflation Adjusted</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2 break-words">
                ₹{forecast?.forecastScenarios?.inflationAdjusted?.toLocaleString() || 0}
              </p>
            </Card>
          </section>

          {/* TREND SECTION */}
          <section className="mt-6 sm:mt-10 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-slate-900">
                Savings Trend
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                Compared to your recent average
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
              {trendIcon}
              <span className="capitalize">
                {forecast?.trend?.direction?.toUpperCase() || 'STABLE'}
              </span>
              <span>({forecast?.trend?.pctChange || 0}%)</span>
            </div>
          </section>

          {/* CHART */}
          <section className="mt-6 sm:mt-10 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-sm border">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Savings History & Forecast
            </h2>

            {loading ? (
              <p className="text-slate-400 text-center py-8 sm:py-12">Loading forecast...</p>
            ) : chartData.length > 0 ? (
              <div className="h-64 sm:h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${val.toLocaleString()}`, "Savings"]}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Savings"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="#6366f133"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8 sm:py-12">No savings data available yet.</p>
            )}

            <div className="mt-4 sm:mt-6 bg-indigo-50 text-indigo-900 p-3 sm:p-4 rounded-xl text-xs sm:text-sm">
              💡 This projection uses a weighted moving average.
              Recent months influence the forecast more than older months.
            </div>
          </section>

          {/* ACTION RECOMMENDATION */}
          <section className="mt-6 sm:mt-10 bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              What Should You Do?
            </h3>

            {forecast?.trend?.direction === "down" ? (
              <p className="text-slate-300 text-sm sm:text-base">
                Your savings are declining. Consider reviewing subscriptions,
                reducing discretionary expenses, or increasing income sources.
              </p>
            ) : forecast?.trend?.direction === "up" ? (
              <p className="text-slate-300 text-sm sm:text-base">
                Great progress! Maintain this behavior and consider investing
                surplus savings for long-term growth.
              </p>
            ) : (
              <p className="text-slate-300 text-sm sm:text-base">
                Your savings are stable. Small improvements can accelerate
                long-term wealth growth.
              </p>
            )}
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
