import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const typeStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
};

const typeIcons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-lg p-4 flex items-center gap-3 shadow-lg animate-in slide-in-from-right pointer-events-auto max-w-sm ${typeStyles[toast.type]}`}
          role="alert"
          aria-live="polite"
        >
          {typeIcons[toast.type]}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 hover:opacity-70 transition-opacity"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
