import { Lightbulb, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { SkeletonBox } from '../../components/ui/Skeleton';
import { IS_DEV_TOOLS_VISIBLE } from '../../constants';
import type { WeeklyInsight } from '../../types';

interface WeeklyInsightCardProps {
  insight: WeeklyInsight;
  isFallback: boolean;
  isLoading: boolean;
  onToggleMode: (simulateFallback: boolean) => void;
}

export function WeeklyInsightCard({
  insight,
  isFallback,
  isLoading,
  onToggleMode,
}: WeeklyInsightCardProps) {
  return (
    <div className="rounded-2xl border border-soga-600/30 border-l-4 border-l-soga-800 bg-canvas-100/80 p-5 text-forest-900 shadow-soft sm:p-6 lg:col-span-7">
      <div className="flex h-full flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-soga-600/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-soga-800" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-forest-900">
                Ringkasan Minggu Ini
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-forest-800/75">
              {insight.segmen_highlight} • {insight.periode}
            </p>
          </div>

          <Badge variant={isFallback ? 'warning' : 'sage'}>
            {isFallback ? 'Ringkasan otomatis' : 'AI'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <SkeletonBox className="h-16 w-full bg-canvas-200" />
            <SkeletonBox className="h-24 w-full bg-canvas-200" />
          </div>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed sm:text-sm">
            <div className="rounded-xl border border-soga-600/20 bg-white/85 p-3.5">
              <p className="font-semibold text-soga-900">Ringkasan kinerja</p>
              <p className="mt-1 text-forest-900">{insight.isi_json.ringkasan}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-success-300/80 bg-success-50/60 p-3.5">
                <p className="font-semibold text-success-800">Hal positif</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-success-900">
                  {insight.isi_json.sorotan.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-warning-400/80 bg-warning-50/80 p-3.5">
                <p className="font-semibold text-warning-900">Perlu perhatian</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-warning-950">
                  {insight.isi_json.risiko.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-soga-600/20 bg-white/90 p-3.5">
              <p className="font-semibold text-soga-900">Saran tindakan</p>
              <ul className="mt-1 space-y-1 text-forest-900">
                {insight.isi_json.rekomendasi.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {IS_DEV_TOOLS_VISIBLE ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-soga-600/20 pt-3 text-[11px] text-forest-800/75">
            <span>
              Dev: {isFallback ? 'Mode Cadangan' : 'AI Live'} ({insight.prompt_version})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onToggleMode(true)}
                className="rounded-lg border border-warning-400 bg-warning-50 px-2.5 py-1 font-semibold text-warning-900 hover:bg-warning-100"
              >
                Uji Fallback Kuota Habis
              </button>
              <button
                type="button"
                onClick={() => onToggleMode(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-soga-600/40 bg-white px-2.5 py-1 font-semibold text-forest-900 hover:bg-canvas-50"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                <span>Muat AI</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
