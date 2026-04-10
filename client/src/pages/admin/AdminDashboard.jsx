import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Users,
  CreditCard,
  Newspaper,
  Database,
  Cpu,
  FileText,
  Settings,
  Activity
} from "lucide-react";

export default function AdminDashboard() {
  const [system, setSystem] = useState(null);

  useEffect(() => {
    api.get("/admin/system/status").then(res => {
      setSystem(res.data);
    });
  }, []);

  const adminLinks = [
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
    { name: "News", path: "/admin/news", icon: Newspaper },
    { name: "Funds", path: "/admin/funds", icon: Database },
    { name: "System", path: "/admin/system", icon: Cpu },
    { name: "Logs", path: "/admin/logs", icon: FileText },
    { name: "Config", path: "/admin/config", icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-8 space-y-10">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Control Center
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor infrastructure and manage platform operations
          </p>
        </div>

        {/* ================= SYSTEM STATUS ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            System Health
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Uptime */}
            <div className="flex items-center justify-between p-6 rounded-xl bg-green-50 border border-green-100">
              <div>
                <p className="text-sm text-slate-500">Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {system?.uptime?.toFixed(0) || 0} sec
                </p>
              </div>
              <Activity className="text-green-500" size={32} />
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between p-6 rounded-xl bg-blue-50 border border-blue-100">
              <div>
                <p className="text-sm text-slate-500">Heap Used</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(system?.memory?.heapUsed / 1024 / 1024) || 0} MB
                </p>
              </div>
              <Database className="text-blue-500" size={32} />
            </div>

            {/* Platform */}
            <div className="flex items-center justify-between p-6 rounded-xl bg-indigo-50 border border-indigo-100">
              <div>
                <p className="text-sm text-slate-500">Platform</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {system?.platform || "-"}
                </p>
              </div>
              <Cpu className="text-indigo-500" size={32} />
            </div>

          </div>
        </div>

        {/* ================= ADMIN CONTROLS ================= */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            Administrative Controls
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {adminLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className="group bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition">
                  <link.icon size={28} className="text-red-500" />
                </div>

                <span className="font-semibold text-slate-800 group-hover:text-red-600 transition">
                  {link.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}