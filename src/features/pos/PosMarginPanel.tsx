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
    <div className="flex flex-col justify-between border-t border-soga-600/30 bg-canvas-100/70 p-5 sm:p-7 lg:col-span-5 lg:border-l lg:border-t-0">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
            Perhitungan Margin POS
          </p>
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        </div>

        <div className="space-y-3 border-b border-soga-600/30 pb-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-forest-800/85">
              Total Penjualan Masuk ({marginSummary.totalUnit} unit):
            </span>
            <span className="font-bold text-forest-900">
              {formatRupiah(marginSummary.totalPenjualan)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-forest-800/85">Snapshot HPP Modal:</span>
            <span className="font-semibold text-red-700">
              - {formatRupiah(marginSummary.totalHpp)}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
              Estimasi Laba Kotor
            </p>
            <p className="text-[11px] text-forest-800/75">
              Sebelum beban operasional toko
            </p>
          </div>
          <p
            className={cn(
              'font-display text-xl font-bold',
              marginSummary.isLoss ? 'text-red-700' : 'text-sage-600'
            )}
          >
            {marginSummary.labaKotor >= 0 ? '+ ' : ''}
            {formatRupiah(marginSummary.labaKotor)}
          </p>
        </div>

        <div className="rounded-xl border border-sage-400/60 bg-sage-200/35 px-3.5 py-2.5 text-xs text-forest-900">
          <span className="font-semibold">Info Kasir:</span> Margin dihitung langsung dari snapshot resep HPP terbaru produk terkait.
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
          <CheckCircle2 className="h-4 w-4" />
          <span>Simpan Transaksi Kasir</span>
        </Button>
      </div>
    </div>
  );
}
