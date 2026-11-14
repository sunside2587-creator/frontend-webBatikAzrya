import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { ToastVariant } from '../../types';
import { cn } from '../../utils/cn';

const TOAST_STYLES: Record<ToastVariant, { container: string; icon: ReactNode }> = {
  success: {
    container: 'border-sage-600 bg-forest-900 text-canvas-50',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-200" />,
  },
  warning: {
    container: 'border-amber-500 bg-amber-50 text-amber-950',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />,
  },
  error: {
    container: 'border-red-600 bg-red-50 text-red-900',
    icon: <XCircle className="h-5 w-5 shrink-0 text-red-700" />,
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-6"
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.variant] || TOAST_STYLES.success;
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-elevated transition-all duration-200',
              style.container
            )}
          >
            {style.icon}
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-75 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
