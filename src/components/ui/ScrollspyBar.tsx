import { ListFilter } from 'lucide-react';
import type { ScrollspyGroupItem } from '../../types';
import { cn } from '../../utils/cn';

interface ScrollspyBarProps<K extends string> {
  activeRowIndex: number;
  totalRows: number;
  activeItemId?: string;
  scrollProgress: number;
  groups: ScrollspyGroupItem<K>[];
  activeGroupKey: K;
  ariaLabel: string;
  onSelectGroup: (startIdx: number) => void;
}

export function ScrollspyBar<K extends string>({
  activeRowIndex,
  totalRows,
  activeItemId = '-',
  scrollProgress,
  groups,
  activeGroupKey,
  ariaLabel,
  onSelectGroup,
}: ScrollspyBarProps<K>) {
  return (
    <div className="overflow-hidden rounded-xl border border-soga-600/35 bg-canvas-100/90 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-forest-900">
          <ListFilter className="h-3.5 w-3.5 shrink-0 text-soga-900" aria-hidden="true" />
          <span>
            <strong>Baris {activeRowIndex + 1}</strong> dari {totalRows}{' '}
            <span className="text-forest-800/75">({activeItemId})</span>
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5" aria-label={ariaLabel}>
          {groups.map((group) => {
            const isActiveGroup = activeGroupKey === group.key;
            const isDisabled = group.count === 0;
            return (
              <button
                key={group.key}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectGroup(group.startIdx)}
                aria-current={isActiveGroup ? 'location' : undefined}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActiveGroup
                    ? 'border-forest-900 bg-forest-900 text-canvas-50 shadow-sm'
                    : 'border-soga-400/60 bg-white text-forest-800 hover:bg-canvas-50',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {group.label}{' '}
                <span
                  className={cn(
                    'ml-1 text-[11px]',
                    isActiveGroup ? 'text-sage-200' : 'text-forest-800/65'
                  )}
                >
                  ({group.count})
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="h-1 w-full bg-canvas-200">
        <div
          className="h-full bg-soga-700 transition-all duration-150"
          style={{ width: `${Math.max(8, scrollProgress)}%` }}
        />
      </div>
    </div>
  );
}
