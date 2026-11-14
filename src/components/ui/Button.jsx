import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'bg-soga-900 text-canvas-50 hover:bg-soga-800 focus-visible:ring-soga-700 border border-soga-900 shadow-sm',
  secondary:
    'bg-forest-900 text-canvas-50 hover:bg-forest-800 focus-visible:ring-forest-800 border border-forest-900 shadow-sm',
  outline:
    'bg-canvas-50 text-soga-900 border border-soga-600/60 hover:bg-canvas-100 focus-visible:ring-soga-700',
  ghost:
    'bg-transparent text-forest-900 hover:bg-canvas-100 focus-visible:ring-soga-700 border border-transparent',
  danger:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600 border border-red-700 shadow-sm',
};

const SIZE_CLASSES = {
  sm: 'min-h-11 px-3.5 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm sm:text-base',
  lg: 'min-h-12 px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-50 disabled:cursor-not-allowed disabled:opacity-60 ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
      } ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
