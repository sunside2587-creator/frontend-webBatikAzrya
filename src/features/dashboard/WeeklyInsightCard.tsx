import { RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { BatikDarkBackdrop } from '../../components/ui/BatikOrnaments';
import { SkeletonBox } from '../../components/ui/Skeleton';
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
    <div className="relative overflow-hidden rounded-2xl border border-soga-600/45 bg-forest-900 p-5 text-canvas-50 shadow-elevated lg:col-span-7">
      <BatikDarkBackdrop />

      <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-soga-600/30 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-soga-400" />
              <h2 className="font-display text-lg font-bold text-canvas-50">
                Kartu Insight Mingguan Gemini AI
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-sage-200/80">
              {insight.segmen_highlight} • {insight.periode}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFallback ? (
              <Badge variant="warning">Ringkasan otomatis tanpa AI</Badge>
            ) : (
              <Badge variant="sage">AI Live (Gemini API)</Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <SkeletonBox className="h-16 w-full bg-forest-800" />
            <SkeletonBox className="h-24 w-full bg-forest-800" />
          </div>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed sm:text-sm">
            <div className="rounded-xl border border-soga-600/30 bg-forest-800/80 p-3.5">
              <p className="font-bold uppercase tracking-wider text-soga-400">
                1. Ringkasan Kinerja
              </p>
              <p className="mt-1 text-canvas-50/95">{insight.isi_json.ringkasan}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-soga-600/30 bg-forest-800/75 p-3.5">
                <p className="font-bold uppercase tracking-wider text-sage-200">
                  2. Sorotan Positif
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-canvas-50/90">
                  {insight.isi_json.sorotan.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-400/35 bg-forest-800/75 p-3.5">
                <p className="font-bold uppercase tracking-wider text-amber-300">
                  3. Potensi Risiko
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-canvas-50/90">
                  {insight.isi_json.risiko.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-soga-600/40 bg-forest-800/90 p-3.5">
              <p className="font-bold uppercase tracking-wider text-soga-400">
                4. Rekomendasi AI
              </p>
              <ul className="mt-1 space-y-1 text-canvas-50/95">
                {insight.isi_json.rekomendasi.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-soga-600/25 pt-3 text-[11px] text-sage-200/80">
          <span>
            Status: {isFallback ? 'Mode Cadangan Tanpa AI' : 'AI Live (Gemini API)'} • Versi:{' '}
            {insight.prompt_version}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onToggleMode(true)}
              className="rounded-lg border border-amber-400/50 px-2.5 py-1 font-semibold text-amber-200 hover:bg-forest-800"
            >
              Uji Fallback Kuota Habis
            </button>
            <button
              type="button"
              onClick={() => onToggleMode(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-soga-400/50 px-2.5 py-1 font-semibold text-canvas-50 hover:bg-forest-800"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Muat AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
