import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, NumberInput, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonBox } from '../components/ui/Skeleton';
import { ExpenseHistorySection } from '../features/expenses/ExpenseHistorySection';
import { OcrScannerCard } from '../features/expenses/OcrScannerCard';
import { useExpensesFeature } from '../features/expenses/useExpensesFeature';
import { cn } from '../utils/cn';
import { formatRupiah } from '../utils/formatters';

interface ExpensesOcrPageProps {
  embedded?: boolean;
}

export function ExpensesOcrPage({ embedded = false }: ExpensesOcrPageProps) {
  const {
    materials,
    sortedExpenses,
    isLoadingList,
    isScanning,
    isSaving,
    mode,
    ocrErrorBanner,
    previewImageUrl,
    selectedFileName,
    draft,
    totalDraft,
    userConfirmedLowConf,
    setUserConfirmedLowConf,
    selectedProofUrl,
    setSelectedProofUrl,
    handleRunOcrScan,
    handleFileChange,
    handleSwitchToManualMode,
    handleUpdateDraftField,
    handleUpdateItemField,
    handleAddDraftItem,
    handleRemoveDraftItem,
    handleResetDraft,
    handleSaveExpense,
  } = useExpensesFeature();

  const renderStatusBadge = () => {
    if (mode === 'manual') {
      return <Badge variant="neutral">Diisi manual</Badge>;
    }
    if (draft.needs_verification) {
      return (
        <Badge variant="warning">
          <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Perlu dicek</span>
        </Badge>
      );
    }
    return (
      <Badge variant="sage">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Terbaca jelas</span>
      </Badge>
    );
  };

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={cn(!embedded && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}>
      <PageHeader
        as={HeadingTag}
        title="Nota Belanja"
        description="Foto nota, cek angkanya, lalu simpan. Harga bahan di Kalkulator HPP ikut diperbarui."
      />

      {ocrErrorBanner ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-warning-400 bg-warning-50 p-4 text-sm text-warning-950"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">
              Pembaca nota otomatis tidak tersedia • Diisi manual
            </p>
            <p className="mt-0.5">{ocrErrorBanner}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunOcrScan(null, 'high_confidence')}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <OcrScannerCard
          previewImageUrl={previewImageUrl}
          selectedFileName={selectedFileName}
          onFileChange={handleFileChange}
          onSwitchToManual={handleSwitchToManualMode}
        />

        <form onSubmit={handleSaveExpense} className="lg:col-span-7">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-900">
                  {mode === 'manual' ? 'Isi nota manual' : 'Hasil baca nota'}
                </h2>
                <p className="text-xs text-forest-800/75">
                  {mode === 'manual' ? 'Diisi manual' : 'Dari foto nota'}
                </p>
              </div>
              {renderStatusBadge()}
            </div>

            {isScanning ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-soga-900">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Membaca teks nota...</span>
                </div>
                <SkeletonBox className="h-12 w-full" />
                <SkeletonBox className="h-32 w-full" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {mode === 'ocr' && draft.needs_verification ? (
                  <div className="rounded-xl border border-warning-400 bg-warning-50 p-3.5 text-xs leading-relaxed text-warning-950">
                    <strong>Perlu dicek:</strong> Sebagian teks pada baris harga lilin malam terlipat. Periksa dan sesuaikan angka sebelum menyimpan.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      id="exp-toko"
                      label="Nama Toko / Suplier"
                      value={draft.toko}
                      onChange={(e) => handleUpdateDraftField('toko', e.target.value)}
                      placeholder="Contoh: Toko Bahan Batik Sumber Malam"
                    />
                  </div>
                  <Input
                    id="exp-tanggal"
                    type="date"
                    label="Tanggal Transaksi"
                    value={draft.tanggal}
                    onChange={(e) => handleUpdateDraftField('tanggal', e.target.value)}
                  />
                </div>

                <Select
                  id="exp-kategori"
                  label="Kategori Pengeluaran"
                  value={draft.kategori}
                  onChange={(e) => handleUpdateDraftField('kategori', e.target.value)}
                >
                  <option value="bahan">Bahan Baku (Kain Mori, Malam, Pewarna)</option>
                  <option value="alat">Alat Produksi (Canting, Wajan, Kompor)</option>
                  <option value="operasional">Operasional (Gas, Listrik, Kemasan)</option>
                </Select>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-forest-900">
                      Rincian barang (dicocokkan ke bahan HPP)
                    </p>
                    <button
                      type="button"
                      onClick={handleAddDraftItem}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-soga-900 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Tambah Baris</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {draft.items.map((item, idx) => {
                      const subtotal =
                        (Number(item.qty) || 0) * (Number(item.harga_per_satuan) || 0);
                      const needsCorrection = Boolean(
                        item.needs_correction && draft.needs_verification
                      );
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-12 sm:items-center',
                            needsCorrection
                              ? 'border-warning-400 bg-warning-50/60'
                              : 'border-soga-400/50 bg-canvas-50/70'
                          )}
                        >
                          <div className="sm:col-span-5">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-forest-900">
                                {item.nama_item}
                              </span>
                              {needsCorrection ? <Badge variant="warning">Koreksi</Badge> : null}
                            </div>
                            <select
                              aria-label={`Cocokkan master bahan baris ${idx + 1}`}
                              value={item.material_id}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'material_id', e.target.value)
                              }
                              className="mt-1 w-full rounded border border-soga-400/60 bg-white px-2 py-1 text-xs text-forest-800"
                            >
                              <option value="">Bukan bahan HPP</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nama} ({m.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:col-span-4">
                            <NumberInput
                              allowDecimal
                              min="0"
                              step="0.5"
                              aria-label={`Jumlah baris ${idx + 1}`}
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'qty', e.target.value)
                              }
                              className="min-h-10 w-full rounded-lg border border-soga-400/70 bg-white px-2.5 text-sm font-semibold text-forest-900"
                            />
                            <NumberInput
                              min="0"
                              step="500"
                              aria-label={`Harga satuan baris ${idx + 1}`}
                              value={item.harga_per_satuan}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'harga_per_satuan', e.target.value)
                              }
                              className="min-h-10 w-full rounded-lg border border-soga-400/70 bg-white px-2.5 text-sm font-semibold text-forest-900"
                            />
                          </div>

                          <div className="flex items-center justify-between sm:col-span-3 sm:justify-end sm:gap-2">
                            <span className="font-sans text-sm font-bold tabular-nums text-forest-900">
                              {formatRupiah(subtotal)}
                            </span>
                            {draft.items.length > 1 ? (
                              <button
                                type="button"
                                aria-label="Hapus baris item"
                                onClick={() => handleRemoveDraftItem(idx)}
                                className="rounded p-1.5 text-danger-700 hover:bg-danger-50"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-canvas-200 pt-3">
                  <span className="text-sm font-semibold text-forest-900">
                    Total nota:
                  </span>
                  <span className="font-sans text-xl font-bold tabular-nums text-forest-900">
                    {formatRupiah(totalDraft)}
                  </span>
                </div>

                {mode === 'ocr' && draft.needs_verification ? (
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-warning-300 bg-warning-50/70 p-3 text-xs text-warning-950">
                    <input
                      type="checkbox"
                      checked={userConfirmedLowConf}
                      onChange={(e) => setUserConfirmedLowConf(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-soga-900"
                    />
                    <span>
                      Saya sudah memeriksa angka pada kolom bertanda koreksi dan memastikan data sesuai nota asli.
                    </span>
                  </label>
                ) : null}

                <div className="rounded-lg bg-sage-200/35 px-3 py-2 text-xs text-forest-900">
                  Harga bahan yang terhubung ke HPP akan ikut diperbarui saat disimpan.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetDraft}
                    className="flex-1 sm:flex-none"
                  >
                    Reset Draf
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Simpan Nota</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </form>
      </div>

      {!embedded ? (
        <ExpenseHistorySection
          expenses={sortedExpenses}
          materials={materials}
          isLoading={isLoadingList}
          onSelectProofUrl={setSelectedProofUrl}
        />
      ) : null}

      <Modal
        isOpen={Boolean(selectedProofUrl)}
        onClose={() => setSelectedProofUrl('')}
        title="Pratinjau Bukti Nota Digital"
      >
        {selectedProofUrl ? (
          <img
            src={selectedProofUrl}
            alt="Bukti nota belanja bahan batik"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/corak_batikHitam.jpg';
            }}
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Modal>
    </section>
  );
}
export default ExpensesOcrPage;
