import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import ProgressBar from '../components/common/ProgressBar';
import api from '../services/api';

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limitAmount: ''
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const date = new Date();
      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      const res = await api.get('/budget/summary', {
        params: { month }
      });

      setBudgets(res.data.summary || []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const limitAmount = Number(formData.limitAmount);

      if (Number.isNaN(limitAmount) || limitAmount < 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (editingBudget) {
        // ✅ UPDATE (no month sent)
        await api.put(`/budget/${editingBudget._id}`, {
          category: formData.category,
          limitAmount
        });
      } else {
        // ✅ CREATE
        const date = new Date();
        const month = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;

        await api.post('/budget', {
          category: formData.category,
          limitAmount,
          month
        });
      }

      setIsModalOpen(false);
      setEditingBudget(null);
      setFormData({ category: '', limitAmount: '' });
      fetchBudgets();
    } catch (error) {
      console.error('Save failed:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to save budget');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budget/${id}`);
      fetchBudgets();
    } catch (error) {
      console.error('Delete failed:', error.response?.data || error);
    }
  };

  const openCreate = () => {
    setEditingBudget(null);
    setFormData({ category: '', limitAmount: '' });
    setIsModalOpen(true);
  };

  const openEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limitAmount: budget.limitAmount
    });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Monthly Budgets
          </h1>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Set Budget
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-slate-500 mb-4">
              No budgets set for this month.
            </div>
            <Button onClick={openCreate}>
              Create Your First Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const limit = budget.limitAmount;
              const percent = Math.min(
                100,
                (spent / limit) * 100
              );
              const isOver = spent > limit;
              const isWarning = percent >= 80;

              return (
                <Card
                  key={budget._id}
                  className="relative overflow-visible"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {budget.category}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Includes all {budget.category} expenses
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(budget)}
                        className="text-slate-400 hover:text-primary-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span
                        className={
                          isOver
                            ? 'text-red-600'
                            : 'text-slate-700'
                        }
                      >
                        ₹{spent.toLocaleString()} spent
                      </span>
                      <span className="text-slate-500">
                        Limit: ₹{limit.toLocaleString()}
                      </span>
                    </div>

                    <ProgressBar
                      value={spent}
                      max={limit}
                      className="h-3"
                    />

                    {isOver ? (
                      <div className="flex items-center text-red-600 text-xs font-semibold mt-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Budget exceeded by ₹
                        {(spent - limit).toLocaleString()}
                      </div>
                    ) : isWarning ? (
                      <div className="flex items-center text-amber-600 text-xs font-semibold mt-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Near limit ({percent.toFixed(0)}%)
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 font-medium mt-2">
                        ₹{(limit - spent).toLocaleString()} remaining
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBudget ? 'Edit Budget' : 'Set New Budget'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Category"
              placeholder="e.g. Food, Transport"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value
                })
              }
              required
            />
            <Input
              type="number"
              label="Monthly Limit"
              placeholder="e.g. 5000"
              value={formData.limitAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limitAmount: e.target.value
                })
              }
              required
              min="0"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={formLoading}>
                Save Budget
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
