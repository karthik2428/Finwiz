import { useEffect, useState } from "react";
import api from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Search, Edit, RefreshCcw } from "lucide-react";

const categories = [
  "liquid",
  "ultra_short",
  "short_term",
  "corporate_bond",
  "index",
  "bluechip",
  "large_cap",
  "mid_cap",
  "small_cap",
  "flexi_cap",
  "multi_cap",
  "hybrid",
  "other",
];

export default function AdminFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedFund, setSelectedFund] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ================= FETCH FUNDS ================= */

  const fetchFunds = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/funds", {
        params: {
          search,
          approved: approvedFilter,
          category: categoryFilter,
          page,
          limit: 15,
        },
      });

      setFunds(res.data.funds || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch funds", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [search, approvedFilter, categoryFilter, page]);

  /* ================= UPDATE FUND ================= */

  const updateFund = async () => {
    try {
      await api.put(`/admin/funds/${selectedFund.schemeCode}`, {
        approved: selectedFund.approved,
        categoryOverride: selectedFund.categoryOverride || null,
        notes: selectedFund.notes || "",
      });

      setShowModal(false);
      fetchFunds();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  /* ================= SYNC FUNDS ================= */

  const syncFunds = async () => {
    try {
      setLoading(true);
      await api.post("/admin/funds/sync");
      fetchFunds();
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-10 py-10 space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Fund Management
            </h1>
            <p className="text-slate-500 mt-1">
              Approve and control recommendation universe
            </p>
          </div>

          <button
            onClick={syncFunds}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <RefreshCcw size={16} />
            Sync MFAPI
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search fund..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm w-full"
            />
          </div>

          <select
            value={approvedFilter}
            onChange={(e) => {
              setPage(1);
              setApprovedFilter(e.target.value);
            }}
            className="border border-slate-300 rounded-xl px-4 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Not Approved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="border border-slate-300 rounded-xl px-4 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b text-slate-600">
              <tr>
                <th className="p-4 text-left">Scheme</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-right pr-6">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : funds.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No funds found
                  </td>
                </tr>
              ) : (
                funds.map((fund) => (
                  <tr key={fund._id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium">
                        {fund.schemeName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {fund.schemeCode}
                      </div>
                    </td>

                    <td>{fund.categoryOverride || "—"}</td>

                    <td>
                      {fund.approved ? (
                        <span className="text-emerald-600 font-medium">
                          Approved
                        </span>
                      ) : (
                        <span className="text-rose-600 font-medium">
                          Not Approved
                        </span>
                      )}
                    </td>

                    <td>
                      {new Date(fund.lastUpdated).toLocaleDateString()}
                    </td>

                    <td className="text-right pr-6">
                      <button
                        onClick={() => {
                          setSelectedFund(fund);
                          setShowModal(true);
                        }}
                        className="hover:text-blue-600"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && selectedFund && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded-2xl p-6 space-y-5 shadow-xl">

            <h2 className="text-lg font-semibold">Edit Fund</h2>

            {/* Approved Toggle */}
            <div className="flex justify-between items-center">
              <span>Approved</span>
              <input
                type="checkbox"
                checked={selectedFund.approved}
                onChange={(e) =>
                  setSelectedFund({
                    ...selectedFund,
                    approved: e.target.checked,
                  })
                }
              />
            </div>

            {/* Category Override */}
            <div>
              <label className="text-sm">Category Override</label>
              <select
                value={selectedFund.categoryOverride || ""}
                onChange={(e) =>
                  setSelectedFund({
                    ...selectedFund,
                    categoryOverride: e.target.value || null,
                  })
                }
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm">Notes</label>
              <textarea
                value={selectedFund.notes || ""}
                onChange={(e) =>
                  setSelectedFund({
                    ...selectedFund,
                    notes: e.target.value,
                  })
                }
                className="w-full mt-1 border rounded px-3 py-2"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateFund}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}