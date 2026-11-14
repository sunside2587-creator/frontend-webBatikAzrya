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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
          Omzet Penjualan
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-forest-900">
          {formatRupiah(summary.omzet)}
        </p>
        <p className="mt-1.5 text-xs font-semibold text-sage-600">
          ↗ {summary.pertumbuhan_omzet}
        </p>
      </div>

      <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
          Total HPP Terpakai
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-soga-900">
          {formatRupiah(summary.hpp)}
        </p>
        <p className="mt-1.5 text-xs text-forest-800/75">
          {formatPercent(hppSharePct)} dari omzet
        </p>
      </div>

      <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
          Laba Kotor
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-sage-600">
          {formatRupiah(summary.laba_kotor)}
        </p>
        <p className="mt-1.5 text-xs text-forest-800/75">
          Margin Kotor: {formatPercent(summary.margin_kotor_persen)}
        </p>
      </div>

      <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
          Laba Bersih Operasional
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-forest-900">
          {formatRupiah(summary.laba_bersih)}
        </p>
        <p className="mt-1.5 text-xs font-semibold text-sage-600">
          {summary.arus_kas_status}
        </p>
      </div>
    </div>
  );
}
