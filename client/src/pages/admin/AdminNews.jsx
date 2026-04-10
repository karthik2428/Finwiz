import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminNews() {
  const [settings, setSettings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(null);

  const fetchAll = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.get("/admin/news/categories"),
        api.get("/admin/news/cache/stats"),
      ]);

      setSettings(settingsRes.data.settings);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateSetting = async (category, updatedData) => {
    try {
      setSavingCategory(category);

      const res = await api.put(
        `/admin/news/categories/${category}`,
        updatedData
      );

      const updated = res.data.setting;

      setSettings((prev) =>
        prev.map((s) =>
          s.category === category ? updated : s
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCategory(null);
    }
  };

  const refreshCategory = async (category) => {
    try {
      await api.post(`/admin/news/categories/${category}/refresh`);
      alert(`${category} refreshed successfully`);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-slate-500">
          Loading news dashboard...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-10">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            News Control Panel
          </h1>
          <p className="text-slate-500 mt-1">
            Manage news categories, cache behavior and refresh controls
          </p>
        </div>

        {/* ================= CACHE STATS ================= */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Total Keys" value={stats.keys} />
            <StatCard label="Hits" value={stats.stats?.hits || 0} />
            <StatCard label="Misses" value={stats.stats?.misses || 0} />
            <StatCard label="Key Size" value={stats.stats?.ksize || 0} />
          </div>
        )}

        {/* ================= SETTINGS TABLE ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">
              Category Settings
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-semibold">Category</th>
                <th className="font-semibold">Enabled</th>
                <th className="font-semibold">Cache TTL (seconds)</th>
                <th className="font-semibold">Last Fetched</th>
                <th className="text-right pr-6 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {settings.map((s) => (
                <tr
                  key={s.category}
                  className="border-b hover:bg-slate-50 transition"
                >
                  <td className="p-4 font-medium capitalize text-slate-900">
                    {s.category}
                  </td>

                  {/* ENABLE TOGGLE */}
                  <td>
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) =>
                        updateSetting(s.category, {
                          enabled: e.target.checked,
                          cacheTtlSeconds: s.cacheTtlSeconds,
                        })
                      }
                      className="w-5 h-5 accent-red-600 cursor-pointer"
                    />
                  </td>

                  {/* TTL INPUT */}
                  <td>
                    <input
                      type="number"
                      min="60"
                      value={s.cacheTtlSeconds}
                      onBlur={(e) =>
                        updateSetting(s.category, {
                          enabled: s.enabled,
                          cacheTtlSeconds: Number(e.target.value),
                        })
                      }
                      className="border border-slate-300 rounded-xl px-3 py-1.5 w-32 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                    />
                  </td>

                  <td className="text-slate-600">
                    {s.lastFetchedAt
                      ? new Date(s.lastFetchedAt).toLocaleString()
                      : "Never"}
                  </td>

                  {/* ACTIONS */}
                  <td className="text-right pr-6">
                    <button
                      onClick={() => refreshCategory(s.category)}
                      className="px-4 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm"
                    >
                      Refresh
                    </button>

                    {savingCategory === s.category && (
                      <span className="text-xs ml-3 text-slate-400">
                        Saving...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        {value}
      </p>
    </div>
  );
}