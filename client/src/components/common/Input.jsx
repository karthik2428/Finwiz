import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={cn(
                    'appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
