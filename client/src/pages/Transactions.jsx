import { useState, useEffect } from 'react';
import { Plus, Upload, Trash2, Edit2, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TransactionForm from '../components/dashboard/TransactionForm';
import api from '../services/api';
import Card from '../components/common/Card';

export default function Transactions() {
  const location = useLocation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState({ kind: '' });

  /* ---------------- AUTO OPEN FROM DASHBOARD ---------------- */
  useEffect(() => {
    if (location.state?.openAdd) {
      setEditingTx(null);
      setIsModalOpen(true);

      // Clear history state so refresh won't reopen modal
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  /* ---------------- FETCH ---------------- */
  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filter.kind) params.kind = filter.kind;

      const res = await api.get('/transactions', { params });
      setData(res.data.transactions);
      setPagination(prev => ({
        ...prev,
        page,
        total: res.data.meta.total
      }));
    } catch (error) {
      console.error('Fetch failed', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [filter]);

  /* ------------- PAYLOAD BUILDER ---------- */
  const buildPayload = f => ({
    kind: f.kind,
    amount: Number(f.amount),
    category: f.category,
    merchant: f.merchant,
    note: f.note || '',
    date: new Date(f.date).toISOString()
  });

  /* ---------------- CREATE ---------------- */
  const handleCreate = async formData => {
    setFormLoading(true);
    try {
      await api.post('/transactions', buildPayload(formData));
      setIsModalOpen(false);
      fetchTransactions(1);
    } catch (e) {
      alert(e.response?.data?.message || 'Create failed');
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async formData => {
    setFormLoading(true);
    try {
      await api.put(`/transactions/${editingTx._id}`, buildPayload(formData));
      setIsModalOpen(false);
      setEditingTx(null);
      fetchTransactions(pagination.page);
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async id => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    fetchTransactions(pagination.page);
  };

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      header: 'Date',
      render: r => new Date(r.date).toLocaleDateString()
    },
    {
      header: 'Description',
      className: 'w-1/3',
      render: r => (
        <div>
          <div className="font-medium text-slate-900">
            {r.merchant || 'Unknown'}
          </div>
          {r.note && (
            <div className="text-xs text-slate-500">{r.note}</div>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      render: r => (
        <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700">
          {r.category || 'Uncategorized'}
        </span>
      )
    },
    {
      header: 'Amount',
      render: r => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-semibold
            ${
              r.kind === 'income'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
        >
          {r.kind === 'income' ? '↑' : '↓'} ₹
          {Number(r.amount).toLocaleString()}
        </span>
      )
    },
    {
      header: '',
      render: r => (
        <div className="flex gap-1 opacity-60 hover:opacity-100 transition">
          <button
            onClick={() => {
              setEditingTx(r);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-md hover:bg-primary-50 text-primary-600"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(r._id)}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
            <p className="text-sm text-slate-500">
              Manage your income & expenses effortlessly
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              hidden
              onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;

                const fd = new FormData();
                fd.append('file', file);
                await api.post('/transactions/upload-csv', fd);
                fetchTransactions(1);
                e.target.value = null;
              }}
            />

            <Button
              variant="outline"
              onClick={() =>
                document.getElementById('csv-upload').click()
              }
            >
              <Upload size={16} /> CSV
            </Button>

            <Button
              onClick={() => {
                setEditingTx(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Add
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100">
              <Filter className="h-4 w-4 text-slate-600" />
            </div>

            <div className="flex gap-2">
              {[
                { label: 'All', value: '' },
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter({ kind: f.value })}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition
                    ${
                      filter.kind === f.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* TABLE */}
        <Card className="p-0 overflow-hidden">
          {!loading && data.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-slate-700">
                No transactions yet
              </p>
              <p className="text-sm text-slate-500">
                Add one or upload a CSV to get started
              </p>
            </div>
          )}

          <Table
            columns={columns}
            data={data}
            isLoading={loading}
            pagination={pagination}
            onPageChange={fetchTransactions}
          />
        </Card>

        {/* MODAL */}
        <Modal
          isOpen={isModalOpen}
          title={
            <span className="text-lg font-semibold">
              {editingTx ? 'Edit Transaction' : 'New Transaction'}
            </span>
          }
          onClose={() => {
            setIsModalOpen(false);
            setEditingTx(null);
          }}
        >
          <TransactionForm
            initialData={editingTx}
            onSubmit={editingTx ? handleUpdate : handleCreate}
            isLoading={formLoading}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingTx(null);
            }}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
