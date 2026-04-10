import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.data.logs);
      setFilteredLogs(res.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    if (search) {
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [search, levelFilter, logs]);

  const deleteOldLogs = async () => {
    try {
      const res = await api.delete("/admin/logs/old");
      alert(`${res.data.deletedCount} old logs deleted`);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const levelStyles = (level) => {
    if (level === "error")
      return "bg-red-100 text-red-600 border-red-200";
    if (level === "warn")
      return "bg-amber-100 text-amber-600 border-amber-200";
    return "bg-blue-100 text-blue-600 border-blue-200";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-8">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              System Logs
            </h1>
            <p className="text-slate-500 mt-1">
              Monitor application errors & activity
            </p>
          </div>

          <button
            onClick={deleteOldLogs}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
          >
            Delete Old Logs
          </button>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap gap-4 items-center">

          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm w-72 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
          />

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
          </select>

        </div>

        {/* ================= LOG PANEL ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-h-[70vh] overflow-y-auto space-y-4">

          {loading ? (
            <p className="text-slate-500">Loading logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-slate-400">No logs found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log._id}
                className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-slate-50"
              >

                {/* TOP ROW */}
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">

                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${levelStyles(
                        log.level
                      )}`}
                    >
                      {log.level.toUpperCase()}
                    </span>

                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      {log.method}
                    </span>

                    <span className="text-xs text-slate-500">
                      {log.route}
                    </span>

                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* MESSAGE */}
                <p className="text-sm text-slate-800 mb-2">
                  {log.message}
                </p>

                {/* STACK TRACE TOGGLE */}
                {log.meta?.stack && (
                  <button
                    onClick={() =>
                      setExpandedLog(
                        expandedLog === log._id ? null : log._id
                      )
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    {expandedLog === log._id
                      ? "Hide Stack Trace"
                      : "View Stack Trace"}
                  </button>
                )}

                {/* STACK TRACE */}
                {expandedLog === log._id && (
                  <pre className="mt-3 bg-black text-green-400 text-xs p-4 rounded-xl overflow-x-auto">
                    {log.meta.stack}
                  </pre>
                )}

                {/* FOOTER */}
                <div className="mt-4 text-xs text-slate-400">
                  IP: {log.ip} | User: {log.user || "Guest"}
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}