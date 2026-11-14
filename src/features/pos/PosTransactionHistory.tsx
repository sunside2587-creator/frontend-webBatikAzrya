import { useCallback, useRef } from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScrollspyBar } from '../../components/ui/ScrollspyBar';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PAYMENT_STATUS_GROUPS } from '../../constants';
import { useScrollspyGroups } from '../../hooks/useScrollspyGroups';
import type { Transaction } from '../../types';
import { cn } from '../../utils/cn';
import { formatPercent, formatRupiah, formatTanggalShort } from '../../utils/formatters';
import {
  getPaymentStatusMeta,
  normalizePaymentStatus,
  type SegmentFilter,
} from './usePosFeature';

interface PosTransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  filterSegmen: SegmentFilter;
  onChangeFilterSegmen: (seg: SegmentFilter) => void;
  onSelectDetail: (trx: Transaction) => void;
}

const SEGMENT_FILTER_TABS: readonly SegmentFilter[] = ['ALL', 'B2G', 'B2B', 'B2C'];

export function PosTransactionHistory({
  transactions,
  isLoading,
  filterSegmen,
  onChangeFilterSegmen,
  onSelectDetail,
}: PosTransactionHistoryProps) {
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleResetContainers = useCallback(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
    if (mobileScrollRef.current) mobileScrollRef.current.scrollTop = 0;
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
    items: transactions,
    groups: PAYMENT_STATUS_GROUPS,
    getItemGroup: useCallback((trx: Transaction) => normalizePaymentStatus(trx.status_bayar), []),
    resetKey: filterSegmen,
    onResetContainers: handleResetContainers,
  });

  const handleJumpToGroup = (startIdx: number) => {
    const isDesktopVisible =
      Boolean(tableScrollRef.current && tableScrollRef.current.offsetParent !== null);
    const container = isDesktopVisible ? tableScrollRef.current : mobileScrollRef.current;
    const targetEl = isDesktopVisible
      ? desktopRowRefs.current[startIdx]
      : mobileCardRefs.current[startIdx];
    scrollToRow(startIdx, container, targetEl, isDesktopVisible ? 44 : 0);
  };

  return (
    <div className="mt-10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-forest-900">
          Riwayat Transaksi Kasir
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEGMENT_FILTER_TABS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => onChangeFilterSegmen(seg)}
              className={cn(
                'min-h-10 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                filterSegmen === seg
                  ? 'border-forest-900 bg-forest-900 text-canvas-50'
                  : 'border-soga-400/70 bg-white text-forest-900 hover:bg-canvas-100'
              )}
            >
              {seg === 'ALL' ? 'Semua Segmen' : seg}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={3} /> : null}

      {!isLoading && transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-soga-600/50 bg-white p-8 text-center">
          <p className="text-sm font-medium text-forest-800">
            Belum ada transaksi tercatat pada filter segmen ini.
          </p>
        </div>
      ) : null}

      {!isLoading && transactions.length > 0 ? (
        <div className="space-y-3">
          {isScrollspyActive ? (
            <ScrollspyBar
              activeRowIndex={activeRowIndex}
              totalRows={transactions.length}
              activeItemId={transactions[activeRowIndex]?.id}
              scrollProgress={scrollProgress}
              groups={scrollspyGroups}
              activeGroupKey={activeGroupKey}
              ariaLabel="Navigasi Scrollspy status pembayaran transaksi"
              onSelectGroup={handleJumpToGroup}
            />
          ) : null}

          <div
            ref={tableScrollRef}
            onScroll={(e) => handleContainerScroll(e, desktopRowRefs.current, 68)}
            onWheel={clearProgrammaticSpy}
            onTouchMove={clearProgrammaticSpy}
            onPointerDown={clearProgrammaticSpy}
            className={cn(
              'hidden rounded-2xl border border-soga-600/35 bg-white shadow-soft md:block',
              isScrollspyActive
                ? 'max-h-[440px] overflow-x-auto overflow-y-auto scroll-smooth'
                : 'overflow-hidden'
            )}
          >
            <table className="w-full text-left text-sm">
              <thead
                className={cn(
                  'border-b border-canvas-200 text-xs font-semibold uppercase tracking-wider text-forest-800',
                  isScrollspyActive
                    ? 'sticky top-0 z-10 bg-canvas-100 shadow-sm'
                    : 'bg-canvas-100/70'
                )}
              >
                <tr>
                  <th className="px-4 py-3">ID &amp; Tanggal</th>
                  <th className="px-4 py-3">Segmen</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3">Total &amp; Margin</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-200">
                {transactions.map((trx, idx) => {
                  const isSpyRow = isScrollspyActive && idx === activeRowIndex;
                  const statusMeta = getPaymentStatusMeta(trx.status_bayar);
                  return (
                    <tr
                      key={trx.id}
                      ref={(el) => {
                        desktopRowRefs.current[idx] = el;
                      }}
                      className={cn(
                        'transition-colors hover:bg-canvas-50',
                        isSpyRow && 'bg-canvas-100/70'
                      )}
                    >
                      <td
                        className={cn(
                          'px-4 py-3',
                          isSpyRow && 'border-l-4 border-l-soga-700'
                        )}
                      >
                        <p className="font-semibold text-forest-900">{trx.id}</p>
                        <p className="text-xs text-forest-800/75">
                          {formatTanggalShort(trx.tanggal)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="soga">{trx.pelanggan_tipe}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{trx.metode_bayar}</span> •{' '}
                        <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-forest-900">{formatRupiah(trx.total)}</p>
                        <p className="text-xs font-medium text-sage-600">
                          Margin {formatRupiah(trx.margin_nominal)} (
                          {formatPercent(trx.margin_persen)})
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectDetail(trx)}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            ref={mobileScrollRef}
            onScroll={(e) => handleContainerScroll(e, mobileCardRefs.current, 28)}
            onWheel={clearProgrammaticSpy}
            onTouchMove={clearProgrammaticSpy}
            onPointerDown={clearProgrammaticSpy}
            className={cn(
              'space-y-3 md:hidden',
              isScrollspyActive && 'max-h-[440px] overflow-y-auto pr-1 scroll-smooth'
            )}
          >
            {transactions.map((trx, idx) => {
              const isSpyRow = isScrollspyActive && idx === activeRowIndex;
              const statusMeta = getPaymentStatusMeta(trx.status_bayar);
              return (
                <div
                  key={trx.id}
                  ref={(el) => {
                    mobileCardRefs.current[idx] = el;
                  }}
                  className={cn(
                    'rounded-xl border bg-white p-4 shadow-soft transition-colors',
                    isSpyRow ? 'border-soga-700 bg-canvas-50' : 'border-soga-600/35'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-forest-900">{trx.id}</p>
                      <p className="text-xs text-forest-800/75">
                        {formatTanggalShort(trx.tanggal)} • {trx.metode_bayar}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge variant="soga">{trx.pelanggan_tipe}</Badge>
                      <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-canvas-200 pt-3">
                    <div>
                      <p className="text-base font-bold text-forest-900">
                        {formatRupiah(trx.total)}
                      </p>
                      <p className="text-xs text-sage-600">
                        Laba kotor {formatRupiah(trx.margin_nominal)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onSelectDetail(trx)}>
                      Detail
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
