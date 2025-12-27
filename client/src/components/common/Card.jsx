import { cn } from '../../utils/cn';

export default function Card({ className, children, ...props }) {
    return (
        <div
            className={cn('bg-white overflow-hidden shadow rounded-lg', className)}
            {...props}
        >
            <div className="px-4 py-5 sm:p-6">
                {children}
            </div>
        </div>
    );
}
