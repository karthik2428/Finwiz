import { Fragment, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer
}) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-slate-900/75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className={cn(
                    "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full",
                    sizes[size]
                )}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                                        {title}
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        type="button"
                                        className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="mt-2 text-slate-600">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                    {footer && (
                        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
