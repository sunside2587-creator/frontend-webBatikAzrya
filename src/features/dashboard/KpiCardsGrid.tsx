import { Card } from '../../components/ui/Card';
import { KpiSkeletonGrid } from '../../components/ui/Skeleton';
import type { DashboardSummaryMetrics } from '../../types';
import { formatPercent, formatRupiah } from '../../utils/formatters';

interface KpiCardsGridProps {
  summary: DashboardSummaryMetrics;
  isLoading: boolean;
}

export function KpiCardsGrid({ summary, isLoading }: KpiCardsGridProps) {
  if (isLoading) {
    return <KpiSkeletonGrid />;
  }

  const hppSharePct = summary.omzet > 0 ? (summary.hpp / summary.omzet) * 100 : 0;

  const isGrowthNegative = summary.pertumbuhan_omzet.trim().startsWith('-');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-xs font-medium text-forest-800/75">Omzet penjualan</p>
        <p className="mt-2 font-sans text-2xl font-bold tabular-nums text-forest-900">
          {formatRupiah(summary.omzet)}
        </p>
        <p
          className={`mt-1.5 text-xs font-medium tabular-nums ${
            isGrowthNegative ? 'text-danger-700' : 'text-success-700'
          }`}
        >
          ↗ {summary.pertumbuhan_omzet}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-forest-800/75">Total HPP</p>
        <p className="mt-2 font-sans text-2xl font-bold tabular-nums text-forest-900">
          {formatRupiah(summary.hpp)}
        </p>
        <p className="mt-1.5 text-xs font-medium tabular-nums text-forest-800">
          {formatPercent(hppSharePct)} dari omzet
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-forest-800/75">Laba kotor</p>
        <p
          className={`mt-2 font-sans text-2xl font-bold tabular-nums ${
            summary.laba_kotor < 0 ? 'text-danger-700' : 'text-success-700'
          }`}
        >
          {formatRupiah(summary.laba_kotor)}
        </p>
        <p
          className={`mt-1.5 text-xs font-medium tabular-nums ${
            summary.margin_kotor_persen < 0
              ? 'text-danger-700'
              : summary.margin_kotor_persen < 20
                ? 'text-warning-700'
                : 'text-success-700'
          }`}
        >
          Margin {formatPercent(summary.margin_kotor_persen)}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-forest-800/75">Laba bersih</p>
        <p
          className={`mt-2 font-sans text-2xl font-bold tabular-nums ${
            summary.laba_bersih < 0 ? 'text-danger-700' : 'text-forest-900'
          }`}
        >
          {formatRupiah(summary.laba_bersih)}
        </p>
        <p
          className={`mt-1.5 text-xs font-medium tabular-nums ${
            summary.laba_bersih < 0 ? 'text-danger-700' : 'text-success-700'
          }`}
        >
          {summary.arus_kas_status}
        </p>
      </Card>
    </div>
  );
}
