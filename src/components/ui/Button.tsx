import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-soga-900 bg-soga-900 text-canvas-50 shadow-sm hover:bg-soga-800 focus-visible:ring-soga-700',
  secondary:
    'border border-forest-900 bg-forest-900 text-canvas-50 shadow-sm hover:bg-forest-800 focus-visible:ring-forest-800',
  outline:
    'border border-soga-600/60 bg-canvas-50 text-soga-900 hover:bg-canvas-100 focus-visible:ring-soga-700',
  ghost:
    'border border-transparent bg-transparent text-forest-900 hover:bg-canvas-100 focus-visible:ring-soga-700',
  danger:
    'border border-red-700 bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:ring-red-600',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3.5 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm sm:text-base',
  lg: 'min-h-12 px-6 py-3 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-50 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
