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
      <div className="relative max-w-7xl mx-auto space-y-12 pb-16">

        {/* LOCK OVERLAY */}
        {!isPremium && (
         <div className="absolute inset-0 z-50 flex justify-center items-start pt-24 bg-white/80 backdrop-blur">
            <Card className="p-8 text-center max-w-md shadow-xl">
              <h2 className="text-2xl font-bold mb-3">
                Unlock Premium Forecast
              </h2>

              <p className="text-slate-500 mb-6">
                Get intelligent 90-day projections and financial insights.
              </p>

              {/* PLAN SELECTOR */}
              {/* PLAN SELECTOR */}
<div className="flex justify-center mb-6">
  <div className="flex gap-4 w-full max-w-sm">

    <button
      onClick={() => setSelectedPlan("monthly")}
      className={`flex-1 p-4 rounded-xl border transition text-center ${
        selectedPlan === "monthly"
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white border-slate-300 hover:border-indigo-400"
      }`}
    >
      <div className="font-bold text-lg">₹99</div>
      <div className="text-sm">Monthly</div>
    </button>

    <button
      onClick={() => setSelectedPlan("yearly")}
      className={`flex-1 p-4 rounded-xl border transition relative text-center ${
        selectedPlan === "yearly"
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white border-slate-300 hover:border-indigo-400"
      }`}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-emerald-500 text-white px-3 py-1 rounded-full shadow">
        Save ₹189
      </div>

      <div className="font-bold text-lg">₹999</div>
      <div className="text-sm">Yearly</div>
    </button>

  </div>
</div>

              <Button onClick={handlePayment}>
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
          <section className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-10 shadow-xl">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award />
              90-Day Savings Projection
            </h1>

            <p className="mt-3 text-indigo-100 max-w-2xl">
              We analyze your last 6 months of savings and estimate how your
              savings may grow if your current financial habits continue.
            </p>

            <div className="mt-4 text-sm text-indigo-200">
              {forecast?.insight}
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">

            <Card className="p-6 text-center">
              <p className="text-xs text-slate-500 uppercase">Likely Next Month</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                ₹{forecast?.forecastScenarios?.base?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <p className="text-xs text-slate-500 uppercase">Best Case</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                ₹{forecast?.forecastScenarios?.optimistic?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <p className="text-xs text-slate-500 uppercase">Worst Case</p>
              <p className="text-3xl font-bold text-red-500 mt-2">
                ₹{forecast?.forecastScenarios?.pessimistic?.toLocaleString() || 0}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <p className="text-xs text-slate-500 uppercase">Inflation Adjusted</p>
              <p className="text-3xl font-bold text-amber-500 mt-2">
                ₹{forecast?.forecastScenarios?.inflationAdjusted?.toLocaleString() || 0}
              </p>
            </Card>

          </section>

          {/* TREND SECTION */}
          <section className="mt-10 bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg text-slate-900">
                Savings Trend
              </h3>
              <p className="text-slate-500 text-sm">
                Compared to your recent average
              </p>
            </div>

            <div className="flex items-center gap-3 text-xl font-bold">
              {trendIcon}
              {forecast?.trend?.direction?.toUpperCase()} 
              ({forecast?.trend?.pctChange || 0}%)
            </div>
          </section>

          {/* CHART */}
          <section className="mt-10 bg-white rounded-3xl p-10 shadow-sm border">

            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Savings History
            </h2>

            {loading ? (
              <p className="text-slate-400">Loading forecast...</p>
            ) : chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(val) => [`₹${val}`, "Savings"]} />
                    <Area
                      type="monotone"
                      dataKey="Savings"
                      stroke="#6366f1"
                      strokeWidth={4}
                      fill="#6366f133"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400">No savings data available yet.</p>
            )}

            <div className="mt-6 bg-indigo-50 text-indigo-900 p-4 rounded-xl text-sm">
              💡 This projection uses a weighted moving average.
              Recent months influence the forecast more than older months.
            </div>

          </section>

          {/* ACTION RECOMMENDATION */}
          <section className="mt-10 bg-slate-900 text-white rounded-3xl p-10 shadow-xl">
            <h3 className="text-2xl font-bold mb-4">
              What Should You Do?
            </h3>

            {forecast?.trend?.direction === "down" ? (
              <p className="text-slate-300">
                Your savings are declining. Consider reviewing subscriptions,
                reducing discretionary expenses, or increasing income sources.
              </p>
            ) : forecast?.trend?.direction === "up" ? (
              <p className="text-slate-300">
                Great progress! Maintain this behavior and consider investing
                surplus savings for long-term growth.
              </p>
            ) : (
              <p className="text-slate-300">
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