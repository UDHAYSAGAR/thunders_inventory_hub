import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => onClose(toast.id)}
          />
        );
      })}
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: ToastMessage;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border bg-white animate-slide-in transition-all duration-300 ${
        toast.type === 'success'
          ? 'border-emerald-100 text-emerald-800'
          : 'border-rose-100 text-rose-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        )}
        <p className="text-sm font-medium text-gray-800">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
