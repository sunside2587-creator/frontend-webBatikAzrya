import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type CardPadding = 'none' | 'sm' | 'md';

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
}

export function Card({ children, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-soga-600/30 bg-white shadow-soft',
        PADDING_CLASSES[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className = '',
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-canvas-200 pb-3',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {icon ? <span className="mt-1 shrink-0 text-soga-800">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-forest-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-forest-800/75">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
