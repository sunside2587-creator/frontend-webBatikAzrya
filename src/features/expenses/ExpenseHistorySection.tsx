import { useCallback, useRef } from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScrollspyBar } from '../../components/ui/ScrollspyBar';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EXPENSE_CATEGORY_GROUPS } from '../../constants';
import { useScrollspyGroups } from '../../hooks/useScrollspyGroups';
import type { Expense, Material } from '../../types';
import { cn } from '../../utils/cn';
import { formatRupiah, formatTanggalShort } from '../../utils/formatters';
import { getExpenseCategoryMeta, normalizeExpenseCategory } from './useExpensesFeature';

interface ExpenseHistorySectionProps {
  expenses: Expense[];
  materials: Material[];
  isLoading: boolean;
  onSelectProofUrl: (url: string) => void;
}

export function ExpenseHistorySection({
  expenses,
  materials,
  isLoading,
  onSelectProofUrl,
}: ExpenseHistorySectionProps) {
  const expenseScrollRef = useRef<HTMLDivElement | null>(null);
  const expenseItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleResetContainer = useCallback(() => {
    if (expenseScrollRef.current) {
      expenseScrollRef.current.scrollTop = 0;
    }
  }, []);

  const {
    isScrollspyActive,
    activeRowIndex,
    scrollProgress,
    scrollspyGroups,
    activeGroupKey,
    clearProgrammaticSpy,
    handleContainerScroll,
    scrollToRow,
  } = useScrollspyGroups({
    items: expenses,
    groups: EXPENSE_CATEGORY_GROUPS,
    getItemGroup: useCallback((exp: Expense) => normalizeExpenseCategory(exp.kategori), []),
    onResetContainers: handleResetContainer,
  });

  const handleJumpToGroup = (startIdx: number) => {
    scrollToRow(startIdx, expenseScrollRef.current, expenseItemRefs.current[startIdx], 0);
  };

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-8">
        <h2 className="font-display text-xl font-bold text-forest-900">
          Riwayat Pengeluaran &amp; Bukti Nota
        </h2>

        {isLoading ? <TableSkeleton rows={3} /> : null}

        {!isLoading && expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-soga-600/50 bg-white p-8 text-center">
            <p className="text-sm font-medium text-forest-800">
              Belum ada riwayat pengeluaran tercatat.
            </p>
          </div>
        ) : null}

        {!isLoading && expenses.length > 0 ? (
          <div className="space-y-3">
            {isScrollspyActive ? (
              <ScrollspyBar
                activeRowIndex={activeRowIndex}
                totalRows={expenses.length}
                activeItemId={expenses[activeRowIndex]?.id}
                scrollProgress={scrollProgress}
                groups={scrollspyGroups}
                activeGroupKey={activeGroupKey}
                ariaLabel="Navigasi Scrollspy kategori pengeluaran"
                onSelectGroup={handleJumpToGroup}
              />
            ) : null}

            <div
              ref={expenseScrollRef}
              onScroll={(e) => handleContainerScroll(e, expenseItemRefs.current, 24)}
              onWheel={clearProgrammaticSpy}
              onTouchMove={clearProgrammaticSpy}
              onPointerDown={clearProgrammaticSpy}
              className={cn(
                'space-y-3',
                isScrollspyActive && 'max-h-[480px] overflow-y-auto pr-1 scroll-smooth'
              )}
            >
              {expenses.map((exp, idx) => {
                const isSpyRow = isScrollspyActive && idx === activeRowIndex;
                const categoryMeta = getExpenseCategoryMeta(exp.kategori);
                return (
                  <div
                    key={exp.id}
                    ref={(el) => {
                      expenseItemRefs.current[idx] = el;
                    }}
                    className={cn(
                      'flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-soft transition-colors sm:flex-row sm:items-center',
                      isSpyRow
                        ? 'border-soga-600/50 border-l-4 border-l-soga-700 bg-canvas-50/70'
                        : 'border-soga-600/35'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-forest-900">{exp.toko}</span>
                        <Badge variant={categoryMeta.badgeVariant}>
                          {categoryMeta.label}
                        </Badge>
                        <Badge variant={exp.sumber === 'ocr' ? 'sage' : 'neutral'}>
                          {exp.sumber === 'ocr' ? 'OCR Nota' : 'Manual'}
                        </Badge>
                      </div>
                      <p className="text-xs text-forest-800/75">
                        {exp.id} • {formatTanggalShort(exp.tanggal)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-base font-bold text-forest-900">
                        {formatRupiah(exp.total)}
                      </span>
                      {exp.bukti_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectProofUrl(exp.bukti_url)}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Bukti</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 lg:col-span-4">
        <h2 className="font-display text-xl font-bold text-forest-900">
          Harga Bahan Terkini
        </h2>
        <div className="divide-y divide-canvas-200 rounded-2xl border border-soga-600/35 bg-white p-4 shadow-soft">
          {materials.map((mat) => (
            <div key={mat.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-forest-900">{mat.nama}</p>
                <Badge variant={mat.stok_saat_ini < mat.stok_minimum ? 'warning' : 'sage'}>
                  {mat.stok_saat_ini} {mat.satuan}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-forest-800/80">
                Rata-rata bergerak: <strong>{formatRupiah(mat.harga_per_satuan)}</strong> /{' '}
                {mat.satuan}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
