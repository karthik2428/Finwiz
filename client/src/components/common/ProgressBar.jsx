import { cn } from '../../utils/cn';

export default function ProgressBar({ value, max, className, mode = 'limit' }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100)) || 0;

    let colorClass = 'bg-primary-600';

    if (mode === 'limit') {
        // Expense/Limit logic: Green -> Red
        if (percentage >= 100) colorClass = 'bg-red-600';
        else if (percentage >= 80) colorClass = 'bg-amber-500';
        else if (percentage >= 50) colorClass = 'bg-primary-500';
        else colorClass = 'bg-green-500';
    } else {
        // Goal/Progress logic: Blue -> Green
        if (percentage >= 100) colorClass = 'bg-green-600'; // Success
        else if (percentage >= 50) colorClass = 'bg-primary-600';
        else colorClass = 'bg-primary-500';
    }

    return (
        <div className={cn("w-full bg-slate-200 rounded-full h-2.5", className)}>
            <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
}
