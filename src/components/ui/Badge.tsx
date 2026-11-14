import type { ReactNode } from 'react';
import type { BadgeVariant } from '../../types';
import { cn } from '../../utils/cn';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  sage: 'border-sage-400/60 bg-sage-200/70 text-forest-900',
  forest: 'border-forest-800 bg-forest-900 text-canvas-50',
  soga: 'border-soga-600/40 bg-soga-900/10 text-soga-900',
  warning: 'border-amber-400 bg-amber-100 text-amber-900',
  danger: 'border-red-300 bg-red-100 text-red-800',
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
