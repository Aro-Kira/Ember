import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let globalToasts: Toast[] = [];
let listeners: Array<() => void> = [];
let nextId = 0;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function addToast(message: string, type: ToastType) {
  const id = nextId++;
  globalToasts = [...globalToasts, { id, message, type }];
  emitChange();

  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    emitChange();
  }, 3500);
}

function removeToast(id: number) {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  emitChange();
}

function toast(message: string) {
  addToast(message, 'success');
}

type EnhancedToastFunctions = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

type ToastExport = EnhancedToastFunctions & ((message: string) => void);

toast.success = (message: string) => addToast(message, 'success');
toast.error = (message: string) => addToast(message, 'error');
toast.warning = (message: string) => addToast(message, 'warning');
toast.info = (message: string) => addToast(message, 'info');

const TYPE_CONFIG: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { bg: 'bg-emerald-600', border: 'border-emerald-500', icon: CheckCircle, iconColor: 'text-white' },
  error: { bg: 'bg-red-600', border: 'border-red-500', icon: XCircle, iconColor: 'text-white' },
  warning: { bg: 'bg-amber-600', border: 'border-amber-500', icon: AlertTriangle, iconColor: 'text-white' },
  info: { bg: 'bg-primary-container', border: 'border-primary', icon: Info, iconColor: 'text-on-primary-container' },
};

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  useEffect(() => {
    listeners.push(() => setToasts([...globalToasts]));
    return () => {
      listeners = listeners.filter((l) => l !== listeners[listeners.length - 1]);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const config = TYPE_CONFIG[t.type];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            className={`${config.bg} border ${config.border} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in`}
          >
            <Icon className={`w-5 h-5 ${config.iconColor} shrink-0`} />
            <span className="font-sans font-medium text-sm flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 hover:bg-white/20 rounded transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default toast as ToastExport;
export { ToastContainer };