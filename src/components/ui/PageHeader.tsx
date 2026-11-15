import type { ElementType, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  as?: ElementType;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  as: HeadingTag = 'h1',
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end',
        className
      )}
    >
      <div className="max-w-2xl space-y-1">
        <HeadingTag className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
          {title}
        </HeadingTag>
        {description ? (
          <p className="text-sm leading-relaxed text-forest-800/80 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
