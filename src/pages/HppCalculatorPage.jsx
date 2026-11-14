import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { calculateHpp, getHppRecipes, saveHppRecipe } from '../api/services/hppService';
import { dummyHppRecipes } from '../api/mockData';
import { calculateHppBreakdown } from '../utils/hppFormula';
import { formatRupiah } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input, NumberInput, Select } from '../components/ui/Input';
import { BatikDarkBackdrop } from '../components/ui/BatikOrnaments';

export function HppCalculatorPage({ embedded = false }) {
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState(dummyHppRecipes);
  const [selectedRecipeId, setSelectedRecipeId] = useState('RCP-01');

  const [bahan, setBahan] = useState(dummyHppRecipes[0].bahan);
  const [tenagaKerja, setTenagaKerja] = useState(dummyHppRecipes[0].tenaga_kerja);
  const [overhead, setOverhead] = useState(dummyHppRecipes[0].overhead);
  const [yieldCount, setYieldCount] = useState(dummyHppRecipes[0].yield);
  const [marginTargetPct, setMarginTargetPct] = useState(35);
  const [hargaKustom, setHargaKustom] = useState(dummyHppRecipes[0].harga_kustom);

  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getHppRecipes()
      .then((res) => {
        if (!active || !Array.isArray(res.data) || res.data.length === 0) return;
        setRecipes(res.data);
      })
      .catch(() => {
        // Tetap memakai default dummyHppRecipes
      });
    return () => {
      active = false;
    };
  }, []);

  const loadRecipe = (recipeId) => {
    setSelectedRecipeId(recipeId);
    const found = recipes.find((r) => r.id === recipeId);
    if (!found) return;
    setBahan(found.bahan);
    setTenagaKerja(found.tenaga_kerja);
    setOverhead(found.overhead);
    setYieldCount(found.yield || 1);
    setMarginTargetPct(Math.round((found.margin_target || 0.35) * 100));
    setHargaKustom(found.harga_kustom || 0);
    showToast(`Resep "${found.nama_resep}" dimuat.`, 'success', 2500);
  };

  // Perhitungan reaktif lokal agar alert peringatan di bawah HPP muncul instan (US-04 Scenario 2)
  const result = useMemo(() => {
    return calculateHppBreakdown({
      bahan,
      tenagaKerja,
      overhead,
      yieldCount,
      marginTarget: marginTargetPct / 100,
      hargaKustom,
    });
  }, [bahan, tenagaKerja, overhead, yieldCount, marginTargetPct, hargaKustom]);

  const activeRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];

  const handleMaterialChange = (index, field, value) => {
    setBahan((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: Number(value) || 0 } : item))
    );
  };

  const handleRecalculateApi = async () => {
    setIsCalculating(true);
    try {
      await calculateHpp({
        product_id: activeRecipe?.product_id,
        bahan,
        tenaga_kerja: tenagaKerja,
        overhead,
        yield: Number(yieldCount) || 1,
        margin_target: marginTargetPct / 100,
        harga_kustom: Number(hargaKustom) || 0,
      });
      showToast(
        `Kalkulasi HPP selesai: ${formatRupiah(result.hpp_unit)} per lembar.`,
        'success',
        3000
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveRecipe = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...activeRecipe,
        bahan,
        tenaga_kerja: tenagaKerja,
        overhead,
        yield: Number(yieldCount) || 1,
        margin_target: marginTargetPct / 100,
        harga_kustom: Number(hargaKustom) || 0,
      };
      const res = await saveHppRecipe(payload);
      setRecipes((prev) =>
        prev.map((r) => (r.id === payload.id ? payload : r))
      );
      showToast(res.message || 'Resep HPP produk berhasil disimpan.', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan resep HPP.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={embedded ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'}>
      <div className="mb-6 max-w-2xl space-y-1.5">
        <HeadingTag className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
          Kalkulator HPP Dinamis &amp; Peringatan Anti-Rugi
        </HeadingTag>
        <p className="text-sm leading-relaxed text-forest-800/85 sm:text-base">
          Formula memperhitungkan Biaya Bahan (BB) dengan tingkat susut, Tenaga Kerja Langsung (TKL: canting, warna, lorod), Overhead Pabrik (BOP: penyusutan alat, gas, kemasan), serta Yield produksi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kiri: Komponen Formula BB, TKL, BOP */}
        <div className="space-y-5 lg:col-span-7">
          {/* Selector Resep Produk */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-soga-600/40 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-forest-800/75">Resep Aktif Terpilih:</p>
              <Select
                id="hpp-recipe-select"
                value={selectedRecipeId}
                onChange={(e) => loadRecipe(e.target.value)}
                className="mt-1"
              >
                {recipes.map((rcp) => (
                  <option key={rcp.id} value={rcp.id}>
                    {rcp.nama_resep}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isCalculating}
              onClick={handleRecalculateApi}
              className="shrink-0 sm:mt-5"
            >
              <Calculator className="h-4 w-4" />
              <span>Hitung Ulang</span>
            </Button>
          </div>

          {/* 1. Biaya Bahan Baku (BB) */}
          <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                1. Biaya Bahan Baku (BB)
              </h2>
              <span className="text-sm font-bold text-forest-900">
                Subtotal: {formatRupiah(result.bb)}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {bahan.map((item, idx) => {
                const rowCost = Math.round(
                  (Number(item.pemakaian) || 0) *
                    (Number(item.harga_satuan) || 0) *
                    (1 + (Number(item.susut) || 0))
                );
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-canvas-200 bg-canvas-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        aria-label={`Nama bahan ${idx + 1}`}
                        value={item.nama}
                        onChange={(e) =>
                          setBahan((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, nama: e.target.value } : b))
                          )
                        }
                        className="w-full bg-transparent text-sm font-semibold text-forest-900 focus:outline-none"
                      />
                      <span className="shrink-0 text-sm font-bold text-soga-900">
                        {formatRupiah(rowCost)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-forest-800/75">
                          Pakai ({item.satuan})
                        </label>
                        <NumberInput
                          allowDecimal
                          min="0"
                          step="0.1"
                          value={item.pemakaian}
                          onChange={(e) =>
                            handleMaterialChange(idx, 'pemakaian', e.target.value)
                          }
                          className="mt-0.5 min-h-9 w-full rounded-lg border border-soga-400/70 bg-white px-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-forest-800/75">
                          Harga/@ (Rp)
                        </label>
                        <NumberInput
                          min="0"
                          value={item.harga_satuan}
                          onChange={(e) =>
                            handleMaterialChange(idx, 'harga_satuan', e.target.value)
                          }
                          className="mt-0.5 min-h-9 w-full rounded-lg border border-soga-400/70 bg-white px-2 text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="block text-[11px] text-forest-800/75">
                            Susut (%)
                          </label>
                          <NumberInput
                            min="0"
                            max="50"
                            step="1"
                            value={Math.round((item.susut || 0) * 100)}
                            onChange={(e) =>
                              handleMaterialChange(
                                idx,
                                'susut',
                                (Number(e.target.value) || 0) / 100
                              )
                            }
                            className="mt-0.5 min-h-9 w-full rounded-lg border border-soga-400/70 bg-white px-2 text-sm"
                          />
                        </div>
                        {bahan.length > 1 ? (
                          <button
                            type="button"
                            aria-label={`Hapus ${item.nama}`}
                            onClick={() =>
                              setBahan((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="mb-1 flex h-8 w-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setBahan((prev) => [
                    ...prev,
                    {
                      material_id: 'MAT-NEW',
                      nama: 'Bahan Tambahan Batik',
                      satuan: 'gram',
                      pemakaian: 50,
                      harga_satuan: 100,
                      susut: 0,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-soga-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Komponen Bahan</span>
              </button>
            </div>
          </div>

          {/* 2. Tenaga Kerja Langsung (TKL) */}
          <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                2. Tenaga Kerja Langsung (TKL)
              </h2>
              <span className="text-sm font-bold text-forest-900">
                Subtotal: {formatRupiah(result.tkl)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input
                id="tkl-meter"
                type="number"
                min="0"
                step="0.1"
                label="Panjang Canting (m)"
                value={tenagaKerja.meter_canting}
                onChange={(e) =>
                  setTenagaKerja((prev) => ({
                    ...prev,
                    meter_canting: Number(e.target.value) || 0,
                  }))
                }
              />
              <Input
                id="tkl-upah-m"
                type="number"
                min="0"
                step="1000"
                label="Upah Canting / m"
                value={tenagaKerja.upah_canting_per_meter}
                onChange={(e) =>
                  setTenagaKerja((prev) => ({
                    ...prev,
                    upah_canting_per_meter: Number(e.target.value) || 0,
                  }))
                }
              />
              <Input
                id="tkl-warna"
                type="number"
                min="0"
                step="1000"
                label="Upah Mewarnai"
                value={tenagaKerja.upah_warna}
                onChange={(e) =>
                  setTenagaKerja((prev) => ({
                    ...prev,
                    upah_warna: Number(e.target.value) || 0,
                  }))
                }
              />
              <Input
                id="tkl-lorod"
                type="number"
                min="0"
                step="1000"
                label="Upah Melorod"
                value={tenagaKerja.upah_lorod}
                onChange={(e) =>
                  setTenagaKerja((prev) => ({
                    ...prev,
                    upah_lorod: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* 3. Overhead Pabrik (BOP) & Yield */}
          <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                3. Overhead Pabrik (BOP) &amp; Yield
              </h2>
              <span className="text-sm font-bold text-forest-900">
                Subtotal: {formatRupiah(result.bop)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input
                id="bop-np"
                type="number"
                min="0"
                step="10000"
                label="Nilai Perolehan Alat (NP)"
                value={overhead.np}
                onChange={(e) =>
                  setOverhead((prev) => ({ ...prev, np: Number(e.target.value) || 0 }))
                }
              />
              <Input
                id="bop-ns"
                type="number"
                min="0"
                step="5000"
                label="Nilai Sisa Alat (NS)"
                value={overhead.ns}
                onChange={(e) =>
                  setOverhead((prev) => ({ ...prev, ns: Number(e.target.value) || 0 }))
                }
              />
              <Input
                id="bop-up"
                type="number"
                min="1"
                label="Umur Pakai (Batch)"
                value={overhead.up}
                onChange={(e) =>
                  setOverhead((prev) => ({
                    ...prev,
                    up: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
              <Input
                id="bop-energi"
                type="number"
                min="0"
                step="1000"
                label="Gas & Energi"
                value={overhead.energi}
                onChange={(e) =>
                  setOverhead((prev) => ({ ...prev, energi: Number(e.target.value) || 0 }))
                }
              />
              <Input
                id="bop-kemasan"
                type="number"
                min="0"
                step="1000"
                label="Box & Kemasan Etnik"
                value={overhead.kemasan}
                onChange={(e) =>
                  setOverhead((prev) => ({ ...prev, kemasan: Number(e.target.value) || 0 }))
                }
              />
              <Input
                id="hpp-yield"
                type="number"
                min="1"
                label="Yield (Hasil Lembar)"
                value={yieldCount}
                onChange={(e) => setYieldCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <p className="mt-2 text-xs text-forest-800/75">
              Penyusutan alat per produk: <strong>{formatRupiah(result.penyusutan)}</strong>
            </p>
          </div>
        </div>

        {/* Kanan: Dark Summary Card Sesuai Component 1.png */}
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

                {/* Target Margin & Harga Saran */}
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
                      onChange={(e) =>
                        setMarginTargetPct(
                          Math.min(90, Math.max(1, Number(e.target.value) || 0))
                        )
                      }
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

                {/* Simulasi Harga Jual Kustom (Negosiasi Pemesan) */}
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
                      onChange={(e) => setHargaKustom(e.target.value)}
                      className="w-full bg-transparent py-2 text-base font-bold text-canvas-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Alert Peringatan Harga di Bawah HPP (US-04 Scenario 2) */}
                {result.is_below_hpp ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-400/70 bg-red-950/75 p-4 text-xs leading-relaxed text-red-100"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                    <div>
                      <p className="font-bold text-red-200">
                        Peringatan: Harga di Bawah HPP
                      </p>
                      <p className="mt-1">
                        Harga kustom ({formatRupiah(hargaKustom)}) lebih kecil dari HPP ({formatRupiah(result.hpp_unit)}). Berisiko rugi{' '}
                        <strong>{formatRupiah(Math.abs(result.selisih_kustom))}</strong> per lembar sebelum biaya pengiriman.
                      </p>
                    </div>
                  </div>
                ) : Number(hargaKustom) > 0 ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-sage-400/40 bg-forest-800/80 p-3.5 text-xs text-sage-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-200" />
                    <span>
                      Harga kustom aman di atas modal dengan estimasi laba{' '}
                      <strong>{formatRupiah(result.selisih_kustom)}</strong> per lembar.
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              isLoading={isSaving}
              onClick={handleSaveRecipe}
              className="w-full"
            >
              <Save className="h-4 w-4" />
              <span>Simpan &amp; Tetapkan Resep HPP Produk</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
