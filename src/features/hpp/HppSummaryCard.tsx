import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { BatikDarkBackdrop } from '../../components/ui/BatikOrnaments';
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
  const renderPriceSafetyAlert = () => {
    if (result.is_below_hpp) {
      return (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/70 bg-red-950/75 p-4 text-xs leading-relaxed text-red-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <div>
            <p className="font-bold text-red-200">Peringatan: Harga di Bawah HPP</p>
            <p className="mt-1">
              Harga kustom ({formatRupiah(hargaKustom)}) lebih kecil dari HPP (
              {formatRupiah(result.hpp_unit)}). Berisiko rugi{' '}
              <strong>{formatRupiah(Math.abs(result.selisih_kustom))}</strong> per lembar sebelum biaya pengiriman.
            </p>
          </div>
        </div>
      );
    }

    if (Number(hargaKustom) > 0) {
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-sage-400/40 bg-forest-800/80 p-3.5 text-xs text-sage-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-200" />
          <span>
            Harga kustom aman di atas modal dengan estimasi laba{' '}
            <strong>{formatRupiah(result.selisih_kustom)}</strong> per lembar.
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="lg:col-span-5">
      <div className="sticky top-28 space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-soga-600/45 bg-forest-900 p-6 text-canvas-50 shadow-elevated">
          <BatikDarkBackdrop />

          <div className="relative z-10 space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-soga-400">
              Ringkasan Kalkulasi HPP
            </p>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-sage-200/80">
                HPP Pokok Per Lembar:
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-canvas-50">
                {formatRupiah(result.hpp_unit)}
              </p>
              <p className="mt-1.5 text-xs text-soga-400">
                Komposisi: Bahan {result.komposisi.bb}% • TKL {result.komposisi.tkl}% • BOP{' '}
                {result.komposisi.bop}%
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-soga-600/35 bg-forest-800/80 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="hpp-margin-pct" className="text-sage-200">
                  Target Margin (%):
                </label>
                <NumberInput
                  id="hpp-margin-pct"
                  min="1"
                  max="90"
                  value={marginTargetPct}
                  onChange={(e) => onChangeMargin(e.target.value)}
                  className="w-20 rounded-md border border-soga-600/50 bg-forest-900 px-2 py-1 text-right font-bold text-canvas-50"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-sage-200/90">
                <span>Nominal Margin Saran:</span>
                <span className="font-semibold text-canvas-50">
                  {formatRupiah(result.margin_nominal_saran)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-soga-600/25 pt-2.5">
                <span className="font-semibold text-canvas-50">Harga Jual Saran:</span>
                <span className="font-display text-xl font-bold text-soga-400">
                  {formatRupiah(result.harga_saran)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="hpp-harga-kustom"
                className="block text-xs font-medium text-sage-200"
              >
                Simulasi Harga Jual Kustom (Negosiasi Pemesan):
              </label>
              <div className="flex min-h-11 items-center rounded-xl border border-soga-600/50 bg-forest-800 px-3">
                <span className="mr-2 text-sm font-semibold text-soga-400">Rp</span>
                <NumberInput
                  id="hpp-harga-kustom"
                  min="0"
                  step="5000"
                  value={hargaKustom}
                  onChange={(e) => onChangeHargaKustom(e.target.value)}
                  className="w-full bg-transparent py-2 text-base font-bold text-canvas-50 focus:outline-none"
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
          <Save className="h-4 w-4" />
          <span>Simpan &amp; Tetapkan Resep HPP Produk</span>
        </Button>
      </div>
    </div>
  );
}
