import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { NumberInput } from '../../components/ui/Input';
import type { HppBreakdownResult } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface HppSummaryCardProps {
  result: HppBreakdownResult;
  marginTargetPct: number;
  hargaKustom: number | string;
  isSaving: boolean;
  onChangeMargin: (value: number | string) => void;
  onChangeHargaKustom: (value: number | string) => void;
  onSaveRecipe: () => void;
}

export function HppSummaryCard({
  result,
  marginTargetPct,
  hargaKustom,
  isSaving,
  onChangeMargin,
  onChangeHargaKustom,
  onSaveRecipe,
}: HppSummaryCardProps) {
  const kustomNominal = Number(hargaKustom);
  const negotiationState: 'danger' | 'warning' | 'safe' | 'neutral' = result.is_below_hpp
    ? 'danger'
    : kustomNominal > 0 && kustomNominal < result.harga_saran && kustomNominal >= result.hpp_unit
      ? 'warning'
      : kustomNominal >= result.harga_saran && kustomNominal > 0
        ? 'safe'
        : 'neutral';

  const NEGOTIATION_INPUT_STYLES = {
    danger: {
      wrapper: 'border-danger-400/80 bg-danger-950/45',
      prefix: 'text-danger-200',
      input: 'text-danger-200',
    },
    warning: {
      wrapper: 'border-warning-400/80 bg-warning-950/45',
      prefix: 'text-warning-200',
      input: 'text-warning-200',
    },
    safe: {
      wrapper: 'border-success-400/70 bg-success-950/40',
      prefix: 'text-success-300',
      input: 'text-success-300',
    },
    neutral: {
      wrapper: 'border-soga-600/50 bg-forest-800',
      prefix: 'text-canvas-200',
      input: 'text-canvas-50',
    },
  }[negotiationState];

  const renderPriceSafetyAlert = () => {
    if (negotiationState === 'danger') {
      return (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger-400/70 bg-danger-950/75 p-4 text-xs leading-relaxed text-danger-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-300" aria-hidden="true" />
          <div>
            <p className="font-bold text-danger-200">Bahaya: Harga di bawah HPP</p>
            <p className="mt-1 tabular-nums">
              Harga negosiasi ({formatRupiah(hargaKustom)}) lebih rendah dari modal HPP (
              {formatRupiah(result.hpp_unit)}). Berisiko rugi{' '}
              <strong>{formatRupiah(Math.abs(result.selisih_kustom))}</strong> per lembar sebelum ongkos kirim.
            </p>
          </div>
        </div>
      );
    }

    if (negotiationState === 'warning') {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-warning-400/70 bg-warning-950/65 p-3.5 text-xs leading-relaxed text-warning-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-300" aria-hidden="true" />
          <div>
            <p className="font-bold text-warning-200">Hati-hati: Margin di bawah target</p>
            <p className="mt-1 tabular-nums">
              Masih untung{' '}
              <strong className="text-warning-200">{formatRupiah(result.selisih_kustom)}</strong>{' '}
              per lembar di atas HPP, namun di bawah harga jual saran ({formatRupiah(result.harga_saran)}).
            </p>
          </div>
        </div>
      );
    }

    if (negotiationState === 'safe') {
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-success-400/60 bg-success-950/55 p-3.5 text-xs leading-relaxed text-success-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-300" aria-hidden="true" />
          <span className="tabular-nums">
            <strong className="text-success-200">Aman:</strong> Harga sesuai/di atas saran dengan estimasi laba{' '}
            <strong className="text-success-200">{formatRupiah(result.selisih_kustom)}</strong> per lembar.
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="lg:col-span-5">
      <div className="sticky top-28 space-y-4">
        <div className="rounded-2xl border border-soga-600/35 bg-forest-900 p-6 text-canvas-50 shadow-elevated">
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-canvas-50">
              Ringkasan HPP
            </h2>

            <div>
              <p className="text-xs font-medium text-sage-200/85">HPP per lembar</p>
              <p className="mt-1 font-sans text-4xl font-bold tabular-nums text-canvas-50">
                {formatRupiah(result.hpp_unit)}
              </p>
              <p className="mt-1.5 text-xs tabular-nums text-canvas-200">
                Bahan {result.komposisi.bb}% • Tenaga kerja {result.komposisi.tkl}% • Overhead{' '}
                {result.komposisi.bop}%
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-soga-600/35 bg-forest-800/80 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="hpp-margin-pct" className="text-canvas-200">
                  Target margin (%)
                </label>
                <NumberInput
                  id="hpp-margin-pct"
                  min="1"
                  max="90"
                  value={marginTargetPct}
                  onChange={(e) => onChangeMargin(e.target.value)}
                  className="w-20 rounded-md border border-soga-600/50 bg-forest-900 px-2 py-1 text-right font-sans font-bold tabular-nums text-canvas-50"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-canvas-200">
                <span>Margin per lembar</span>
                <span className="font-sans font-semibold tabular-nums text-success-300">
                  {formatRupiah(result.margin_nominal_saran)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-soga-600/25 pt-2.5">
                <span className="font-semibold text-canvas-50">Harga jual saran</span>
                <span className="font-sans text-xl font-bold tabular-nums text-canvas-50">
                  {formatRupiah(result.harga_saran)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="hpp-harga-kustom"
                className="block text-xs font-medium text-canvas-200"
              >
                Cek harga negosiasi
              </label>
              <div
                className={`flex min-h-11 items-center rounded-xl border px-3 transition-colors ${NEGOTIATION_INPUT_STYLES.wrapper}`}
              >
                <span className={`mr-2 text-sm font-semibold ${NEGOTIATION_INPUT_STYLES.prefix}`}>
                  Rp
                </span>
                <NumberInput
                  id="hpp-harga-kustom"
                  min="0"
                  step="5000"
                  value={hargaKustom}
                  onChange={(e) => onChangeHargaKustom(e.target.value)}
                  className={`w-full bg-transparent py-2 font-sans text-base font-bold tabular-nums focus:outline-none ${NEGOTIATION_INPUT_STYLES.input}`}
                />
              </div>
            </div>

            {renderPriceSafetyAlert()}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          isLoading={isSaving}
          onClick={onSaveRecipe}
          className="w-full"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>Simpan Resep HPP</span>
        </Button>
      </div>
    </div>
  );
}
