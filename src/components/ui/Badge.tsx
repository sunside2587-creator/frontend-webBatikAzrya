import type { ReactNode } from 'react';
import type { BadgeVariant } from '../../types';
import { cn } from '../../utils/cn';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  sage: 'border-success-300 bg-success-100 text-success-800',
  forest: 'border-forest-800 bg-forest-900 text-canvas-50',
  soga: 'border-soga-600/40 bg-soga-900/10 text-soga-900',
  warning: 'border-warning-400 bg-warning-100 text-warning-900',
  danger: 'border-danger-300 bg-danger-100 text-danger-800',
  neutral: 'border-soga-400/60 bg-canvas-100 text-forest-800',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
