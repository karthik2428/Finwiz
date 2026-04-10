import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { MoreVertical } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showPayments, setShowPayments] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (type, id) => {
    try {
      if (type === "block") await api.put(`/admin/users/${id}/block`);
      if (type === "unblock") await api.put(`/admin/users/${id}/unblock`);
      if (type === "activate") await api.put(`/admin/users/${id}/premium-activate`);
      if (type === "deactivate") await api.put(`/admin/users/${id}/premium-deactivate`);
      if (type === "payments") {
        const res = await api.get(`/admin/users/${id}/payments`);
        setSelectedPayments(res.data.payments);
        setShowPayments(true);
      }
      fetchUsers();
      setActiveDropdown(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-8">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage user accounts, premium access & payment history
          </p>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-semibold">User</th>
                <th className="font-semibold">Email</th>
                <th className="font-semibold">Role</th>
                <th className="font-semibold">Premium</th>
                <th className="text-right pr-6 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b hover:bg-slate-50 transition"
                  >
                    {/* USER INFO */}
                    <td className="p-4">
                      <div className="font-medium text-slate-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="text-slate-600">
                      {user.email}
                    </td>

                    {/* ROLE */}
                    <td>
                      <span className="px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600 font-medium capitalize">
                        {user.role}
                      </span>
                    </td>

                    {/* PREMIUM */}
                    <td>
                      {user.premium?.isActive ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-600 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-slate-200 text-slate-600 font-medium">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="relative text-right pr-6">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === user._id ? null : user._id
                          )
                        }
                        className="p-2 rounded-lg hover:bg-slate-200 transition"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeDropdown === user._id && (
                        <div className="absolute right-6 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-md py-2 z-50">

                          <button
                            onClick={() =>
                              handleAction(
                                user.role === "blocked"
                                  ? "unblock"
                                  : "block",
                                user._id
                              )
                            }
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                          >
                            {user.role === "blocked"
                              ? "Unblock User"
                              : "Block User"}
                          </button>

                          <button
                            onClick={() =>
                              handleAction(
                                user.premium?.isActive
                                  ? "deactivate"
                                  : "activate",
                                user._id
                              )
                            }
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                          >
                            {user.premium?.isActive
                              ? "Deactivate Premium"
                              : "Activate Premium"}
                          </button>

                          <button
                            onClick={() =>
                              handleAction("payments", user._id)
                            }
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                          >
                            View Payments
                          </button>

                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ================= PAYMENTS MODAL ================= */}
      {showPayments && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[700px] rounded-2xl shadow-xl p-8 space-y-6">

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Payment History
              </h2>
              <p className="text-sm text-slate-500">
                Review user transactions
              </p>
            </div>

            {selectedPayments.length === 0 ? (
              <p className="text-slate-500">
                No payments found.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-50 transition"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {payment.plan.toUpperCase()} Plan
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ₹{payment.amount}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowPayments(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}