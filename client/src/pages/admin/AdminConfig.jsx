import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/admin/config");
      setConfig(res.data.config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put("/admin/config", config);
      alert("Configuration updated successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config)
    return (
      <DashboardLayout>
        <div className="p-10 text-slate-500">Loading configuration...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-10">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              System Configuration
            </h1>
            <p className="text-slate-500 mt-1">
              Control application logic, pricing, and models
            </p>
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ================= CONFIG SECTIONS ================= */}
        <div className="space-y-8">

          <Section title="Subscription Settings">
            <InputField
              label="Merchant Similarity"
              value={config.subscription.merchantSimilarity}
              onChange={(v) =>
                handleChange("subscription", "merchantSimilarity", Number(v))
              }
            />
            <InputField
              label="Recurring Days Tolerance"
              value={config.subscription.recurringDaysTolerance}
              onChange={(v) =>
                handleChange("subscription", "recurringDaysTolerance", Number(v))
              }
            />
            <InputField
              label="Price Creep %"
              value={config.subscription.priceCreepPercent}
              onChange={(v) =>
                handleChange("subscription", "priceCreepPercent", Number(v))
              }
            />
          </Section>

          <Section title="Forecast Model">
            <InputField
              label="WMA Weights (comma separated)"
              value={config.forecast.wmaWeights.join(",")}
              onChange={(v) =>
                handleChange(
                  "forecast",
                  "wmaWeights",
                  v.split(",").map(Number)
                )
              }
            />
          </Section>

          <Section title="Goal Model Weights">
            <InputField
              label="Amount Weight"
              value={config.goalModel.difficultyWeightAmount}
              onChange={(v) =>
                handleChange("goalModel", "difficultyWeightAmount", Number(v))
              }
            />
            <InputField
              label="Duration Weight"
              value={config.goalModel.difficultyWeightDuration}
              onChange={(v) =>
                handleChange("goalModel", "difficultyWeightDuration", Number(v))
              }
            />
            <InputField
              label="Savings Rate Weight"
              value={config.goalModel.difficultyWeightSavingsRate}
              onChange={(v) =>
                handleChange("goalModel", "difficultyWeightSavingsRate", Number(v))
              }
            />
          </Section>

          <Section title="Recommendation Rules">
            <InputField
              label="Minimum CAGR %"
              value={config.recommendation.minCagrPercent}
              onChange={(v) =>
                handleChange("recommendation", "minCagrPercent", Number(v))
              }
            />
            <InputField
              label="Max Volatility"
              value={config.recommendation.maxVolatility}
              onChange={(v) =>
                handleChange("recommendation", "maxVolatility", Number(v))
              }
            />
          </Section>

          <Section title="Premium Pricing">
            <InputField
              label="Monthly Price"
              value={config.premium.monthlyPrice}
              onChange={(v) =>
                handleChange("premium", "monthlyPrice", Number(v))
              }
            />
            <InputField
              label="Yearly Price"
              value={config.premium.yearlyPrice}
              onChange={(v) =>
                handleChange("premium", "yearlyPrice", Number(v))
              }
            />
          </Section>

          <Section title="PDF Settings">
            <InputField
              label="Footer Text"
              value={config.pdf.footerText}
              onChange={(v) =>
                handleChange("pdf", "footerText", v)
              }
            />
            <InputField
              label="Logo URL"
              value={config.pdf.logoUrl || ""}
              onChange={(v) =>
                handleChange("pdf", "logoUrl", v)
              }
            />
          </Section>

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ============================ */
/* SECTION COMPONENT */
/* ============================ */

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      <div className="border-l-4 border-red-500 pl-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {title}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}

/* ============================ */
/* INPUT FIELD */
/* ============================ */

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition"
      />
    </div>
  );
}