import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

export default function Table({
    columns,
    data,
    isLoading,
    pagination,
    onPageChange,
    emptyMessage = "No data available"
}) {
    return (
        <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-slate-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {columns.map((col, idx) => (
                                        <th
                                            key={idx}
                                            scope="col"
                                            className={cn(
                                                "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider",
                                                col.className
                                            )}
                                        >
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, rowIdx) => (
                                        <tr key={row._id || rowIdx} className="hover:bg-slate-50 transition-colors">
                                            {columns.map((col, colIdx) => (
                                                <td
                                                    key={`${rowIdx}-${colIdx}`}
                                                    className={cn("px-6 py-4 whitespace-nowrap text-sm text-slate-900", col.cellClassName)}
                                                >
                                                    {col.render ? col.render(row) : row[col.accessor]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {pagination && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-700">
                                            Showing <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page <= 1}
                                            onClick={() => onPageChange(pagination.page - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page * pagination.limit >= pagination.total}
                                            onClick={() => onPageChange(pagination.page + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
