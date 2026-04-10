import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("/admin/payments");
        setPayments(res.data.payments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const statusStyles = (status) => {
    if (status === "paid")
      return "bg-emerald-100 text-emerald-600 border-emerald-200";
    if (status === "failed")
      return "bg-red-100 text-red-600 border-red-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-600 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-8">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Payments Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor payment transactions and statuses
          </p>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">
              Recent Payments
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b text-slate-600">
              <tr className="text-left">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="font-semibold">Amount</th>
                <th className="font-semibold">Status</th>
                <th className="font-semibold">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b hover:bg-slate-50 transition"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {payment.razorpayOrderId}
                    </td>

                    <td className="text-slate-700">
                      ₹{payment.amount?.toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles(
                          payment.status
                        )}`}
                      >
                        {payment.status?.toUpperCase()}
                      </span>
                    </td>

                    <td className="text-slate-600">
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>

      </div>
    </DashboardLayout>
  );
}