import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Calendar } from 'lucide-react';

const Input = forwardRef(
    ({ className, label, error, type = "text", ...props }, ref) => {

        const isDate = type === "date";

        return (
            <div className="w-full relative">

                {/* INPUT FIELD */}
                <div className="relative">

                    <input
                        ref={ref}
                        type={type}
                        placeholder=" "
                        className={cn(
                            "peer block w-full rounded-xl border border-slate-200 bg-white px-4 pt-5 pb-2 text-sm text-slate-900 shadow-sm transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                            "placeholder-transparent",
                            isDate && "pr-10",
                            error && "border-red-300 focus:ring-red-500/30 focus:border-red-500",
                            className
                        )}
                        {...props}
                    />

                    {/* FLOATING LABEL */}
                    {label && (
                        <label
                            className={cn(
                                "absolute left-4 top-2 text-xs text-slate-500 transition-all pointer-events-none",
                                "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400",
                                "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-600",
                                error && "peer-focus:text-red-500"
                            )}
                        >
                            {label}
                        </label>
                    )}

                    {/* DATE ICON */}
                    {isDate && (
                        <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    )}
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <p className="mt-1 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;