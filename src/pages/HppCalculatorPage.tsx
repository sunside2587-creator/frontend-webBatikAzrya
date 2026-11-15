import { Calculator, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input, NumberInput, Select } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { HppSummaryCard } from '../features/hpp/HppSummaryCard';
import { useHppFeature } from '../features/hpp/useHppFeature';
import { cn } from '../utils/cn';
import { formatRupiah } from '../utils/formatters';

interface HppCalculatorPageProps {
  embedded?: boolean;
}

export function HppCalculatorPage({ embedded = false }: HppCalculatorPageProps) {
  const {
    recipes,
    selectedRecipeId,
    bahan,
    tenagaKerja,
    overhead,
    yieldCount,
    marginTargetPct,
    hargaKustom,
    setHargaKustom,
    isCalculating,
    isSaving,
    result,
    handleLoadRecipe,
    handleMaterialChange,
    handleAddMaterial,
    handleRemoveMaterial,
    handleLaborChange,
    handleOverheadChange,
    handleYieldChange,
    handleMarginChange,
    handleRecalculateApi,
    handleSaveRecipe,
  } = useHppFeature();

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={cn(!embedded && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}>
      <PageHeader
        as={HeadingTag}
        title="Kalkulator HPP"
        description="Hitung modal per lembar dan harga jual minimum."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Card
            padding="sm"
            className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"
          >
            <Select
              id="hpp-recipe-select"
              label="Resep produk"
              value={selectedRecipeId}
              onChange={(e) => handleLoadRecipe(e.target.value)}
              className="min-w-0 flex-1"
            >
              {recipes.map((rcp) => (
                <option key={rcp.id} value={rcp.id}>
                  {rcp.nama_resep}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              isLoading={isCalculating}
              onClick={handleRecalculateApi}
              className="shrink-0"
            >
              <Calculator className="h-4 w-4" aria-hidden="true" />
              <span>Hitung Ulang</span>
            </Button>
          </Card>

          <Card>
            <CardHeader
              title="1. Bahan baku"
              description="Kain mori, lilin malam, dan pewarna beserta persentase susut."
              action={
                <span className="font-sans text-sm font-bold tabular-nums text-forest-900">
                  Subtotal: {formatRupiah(result.bb)}
                </span>
              }
            />

            <div className="mt-4 space-y-3">
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
                        onChange={(e) => handleMaterialChange(idx, 'nama', e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-forest-900 focus:outline-none"
                      />
                      <span className="shrink-0 font-sans text-sm font-bold tabular-nums text-forest-900">
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
                            onClick={() => handleRemoveMaterial(idx)}
                            className="mb-1 flex h-8 w-8 items-center justify-center rounded-md text-danger-700 hover:bg-danger-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddMaterial}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-soga-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tambah Bahan</span>
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="2. Tenaga kerja"
              description="Upah membatik (canting), pewarnaan, dan melorod."
              action={
                <span className="font-sans text-sm font-bold tabular-nums text-forest-900">
                  Subtotal: {formatRupiah(result.tkl)}
                </span>
              }
            />

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input
                id="tkl-meter"
                type="number"
                min="0"
                step="0.1"
                label="Panjang Canting (m)"
                value={tenagaKerja.meter_canting}
                onChange={(e) => handleLaborChange('meter_canting', e.target.value)}
              />
              <Input
                id="tkl-upah-m"
                type="number"
                min="0"
                step="1000"
                label="Upah Canting / m"
                value={tenagaKerja.upah_canting_per_meter}
                onChange={(e) =>
                  handleLaborChange('upah_canting_per_meter', e.target.value)
                }
              />
              <Input
                id="tkl-warna"
                type="number"
                min="0"
                step="1000"
                label="Upah Mewarnai"
                value={tenagaKerja.upah_warna}
                onChange={(e) => handleLaborChange('upah_warna', e.target.value)}
              />
              <Input
                id="tkl-lorod"
                type="number"
                min="0"
                step="1000"
                label="Upah Melorod"
                value={tenagaKerja.upah_lorod}
                onChange={(e) => handleLaborChange('upah_lorod', e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="3. Overhead & jumlah hasil"
              description="Penyusutan alat, gas/energi, kemasan, dan jumlah lembar jadi per batch."
              action={
                <span className="font-sans text-sm font-bold tabular-nums text-forest-900">
                  Subtotal: {formatRupiah(result.bop)}
                </span>
              }
            />

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input
                id="bop-np"
                type="number"
                min="0"
                step="10000"
                label="Nilai Perolehan Alat (NP)"
                value={overhead.np}
                onChange={(e) => handleOverheadChange('np', e.target.value)}
              />
              <Input
                id="bop-ns"
                type="number"
                min="0"
                step="5000"
                label="Nilai Sisa Alat (NS)"
                value={overhead.ns}
                onChange={(e) => handleOverheadChange('ns', e.target.value)}
              />
              <Input
                id="bop-up"
                type="number"
                min="1"
                label="Umur Pakai (Batch)"
                value={overhead.up}
                onChange={(e) => handleOverheadChange('up', e.target.value)}
              />
              <Input
                id="bop-energi"
                type="number"
                min="0"
                step="1000"
                label="Gas & Energi"
                value={overhead.energi}
                onChange={(e) => handleOverheadChange('energi', e.target.value)}
              />
              <Input
                id="bop-kemasan"
                type="number"
                min="0"
                step="1000"
                label="Box & Kemasan"
                value={overhead.kemasan}
                onChange={(e) => handleOverheadChange('kemasan', e.target.value)}
              />
              <Input
                id="hpp-yield"
                type="number"
                min="1"
                label="Jumlah Hasil (lembar)"
                value={yieldCount}
                onChange={(e) => handleYieldChange(e.target.value)}
              />
            </div>
            <p className="mt-2.5 text-xs text-forest-800/75">
              Penyusutan alat per produk:{' '}
              <strong className="font-sans tabular-nums text-forest-900">
                {formatRupiah(result.penyusutan)}
              </strong>
            </p>
          </Card>
        </div>

        <HppSummaryCard
          result={result}
          marginTargetPct={marginTargetPct}
          hargaKustom={hargaKustom}
          isSaving={isSaving}
          onChangeMargin={handleMarginChange}
          onChangeHargaKustom={setHargaKustom}
          onSaveRecipe={handleSaveRecipe}
        />
      </div>
    </section>
  );
}
export default HppCalculatorPage;
