import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200'
  }[type];

  const textColor = {
    success: 'text-emerald-700',
    error: 'text-rose-700',
    warning: 'text-amber-700',
    info: 'text-blue-700'
  }[type];

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
  }[type];

  const Icon = {
    success: Check,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }[type];

  return (
    <div className={`fixed top-4 right-4 max-w-md ${bgColor} border rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slideInRight z-50`}>
      <Icon size={20} className={iconColor} />
      <p className={`text-sm font-medium ${textColor} flex-1`}>{message}</p>
      <button onClick={onClose} className={`${textColor} hover:opacity-75`}>
        <X size={18} />
      </button>
    </div>
  );
}
