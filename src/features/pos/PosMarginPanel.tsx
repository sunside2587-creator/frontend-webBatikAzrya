import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { BadgeVariant, MarginSummary } from '../../types';
import { cn } from '../../utils/cn';
import { formatPercent, formatRupiah } from '../../utils/formatters';

interface PosMarginPanelProps {
  marginSummary: MarginSummary;
  isSubmitting: boolean;
}

export function PosMarginPanel({
  marginSummary,
  isSubmitting,
}: PosMarginPanelProps) {
  let badgeVariant: BadgeVariant = 'warning';
  if (marginSummary.isLoss) {
    badgeVariant = 'danger';
  } else if (marginSummary.isHealthy) {
    badgeVariant = 'sage';
  }

  const badgeLabel = marginSummary.isLoss
    ? `Rugi ${formatPercent(marginSummary.marginPersen)}`
    : `Margin ${marginSummary.isHealthy ? 'Sehat' : 'Tipis'} ${formatPercent(
        marginSummary.marginPersen,
        true
      )}`;

  return (
    <div className="flex flex-col justify-between border-t border-soga-600/20 bg-canvas-100/70 p-5 sm:p-7 lg:col-span-5 lg:border-l lg:border-t-0 lg:border-soga-600/20">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-forest-900">Ringkasan</h2>
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        </div>

        <div className="space-y-3 border-b border-soga-600/30 pb-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-forest-800/85">
              Total penjualan ({marginSummary.totalUnit} unit)
            </span>
            <span className="font-sans font-bold tabular-nums text-forest-900">
              {formatRupiah(marginSummary.totalPenjualan)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-forest-800/85">Modal (HPP)</span>
            <span className="font-sans font-semibold tabular-nums text-danger-700">
              - {formatRupiah(marginSummary.totalHpp)}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-forest-900">Laba kotor</p>
            <p className="text-[11px] text-forest-800/75">
              Sebelum biaya operasional toko
            </p>
          </div>
          <p
            className={cn(
              'font-sans text-xl font-bold tabular-nums',
              marginSummary.totalUnit === 0
                ? 'text-forest-900'
                : marginSummary.isLoss
                  ? 'text-danger-700'
                  : (marginSummary.labaKotor / (marginSummary.totalPenjualan || 1)) * 100 < 20
                    ? 'text-warning-700'
                    : 'text-success-700'
            )}
          >
            {marginSummary.labaKotor >= 0 ? '+ ' : ''}
            {formatRupiah(marginSummary.labaKotor)}
          </p>
        </div>

        <div className="rounded-xl border border-sage-400/60 bg-sage-200/35 px-3.5 py-2.5 text-xs text-forest-900">
          Margin dihitung dari HPP resep terbaru tiap produk.
        </div>
      </div>

      <div className="mt-6">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>Simpan Transaksi</span>
        </Button>
      </div>
    </div>
  );
}
