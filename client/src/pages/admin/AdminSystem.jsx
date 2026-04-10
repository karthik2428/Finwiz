import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminSystem() {
  const [status, setStatus] = useState(null);
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSystem = async () => {
    try {
      const [statusRes, pingRes] = await Promise.all([
        api.get("/admin/system/status"),
        api.get("/admin/system/ping"),
      ]);

      setStatus(statusRes.data);
      setPing(pingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystem();
    const interval = setInterval(fetchSystem, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatBytes = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  if (loading || !status) {
    return (
      <DashboardLayout>
        <div className="p-10 text-slate-500">
          Loading system status...
        </div>
      </DashboardLayout>
    );
  }

  const isOnline = ping?.status === "ok";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-10">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            System Monitor
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time backend infrastructure overview
          </p>
        </div>

        {/* ================= STATUS GRID ================= */}
        <div className="grid md:grid-cols-4 gap-6">

          {/* Server Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-sm mb-2">
              Server Status
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-xl font-bold ${
                  isOnline
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-sm mb-2">Uptime</p>
            <p className="text-xl font-bold text-slate-900">
              {formatUptime(status.uptime)}
            </p>
          </div>

          {/* Platform */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-sm mb-2">Platform</p>
            <p className="text-xl font-bold uppercase text-slate-900">
              {status.platform}
            </p>
          </div>

          {/* CPU Load */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 text-sm mb-2">CPU Load</p>
            <p className="text-lg font-semibold text-slate-900">
              {status.cpuLoad.join(" | ")}
            </p>
          </div>
        </div>

        {/* ================= MEMORY SECTION ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Memory Usage
          </h2>

          <div className="space-y-6">
            {Object.entries(status.memory).map(([key, value]) => {
              const percent =
                (value / status.memory.heapTotal) * 100;

              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="capitalize text-slate-700">
                      {key}
                    </span>
                    <span className="text-slate-600">
                      {formatBytes(value)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RAW DEBUG ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">
            Debug Data
          </h3>
          <pre className="text-xs bg-slate-100 p-4 rounded-xl overflow-x-auto text-slate-700">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>

      </div>
    </DashboardLayout>
  );
}