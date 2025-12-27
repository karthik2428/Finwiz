import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function TransactionForm({ onSubmit, initialData, isLoading, onCancel }) {
    const [formData, setFormData] = useState({
        kind: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        merchant: '',
        note: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date: new Date(initialData.date).toISOString().split('T')[0]
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
                <label className="flex items-center">
                    <input
                        type="radio"
                        name="kind"
                        value="expense"
                        checked={formData.kind === 'expense'}
                        onChange={() => setFormData({ ...formData, kind: 'expense' })}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-slate-900">Expense</span>
                </label>
                <label className="flex items-center">
                    <input
                        type="radio"
                        name="kind"
                        value="income"
                        checked={formData.kind === 'income'}
                        onChange={() => setFormData({ ...formData, kind: 'income' })}
                        className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-slate-900">Income</span>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    type="number"
                    label="Amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <Input
                    type="date"
                    label="Date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
            </div>

            <Input
                label="Category"
                placeholder="e.g. Food, Salary"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />

            <Input
                label="Merchant/Payee"
                placeholder="e.g. Uber, Amazon"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            />

            <Input
                label="Note (Optional)"
                placeholder="e.g. Lunch with team"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'Update Transaction' : 'Add Transaction'}
                </Button>
            </div>
        </form>
    );
}
