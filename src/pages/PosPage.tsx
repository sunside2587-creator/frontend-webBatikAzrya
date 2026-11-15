import { Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SEGMENT_OPTIONS } from '../constants';
import { PosMarginPanel } from '../features/pos/PosMarginPanel';
import { PosTransactionHistory } from '../features/pos/PosTransactionHistory';
import { getPaymentStatusMeta, usePosFeature } from '../features/pos/usePosFeature';
import type { PaymentMethod, PaymentStatusKey } from '../types';
import { cn } from '../utils/cn';
import { formatRupiah } from '../utils/formatters';

interface PosPageProps {
  embedded?: boolean;
}

export function PosPage({ embedded = false }: PosPageProps) {
  const {
    products,
    isLoadingData,
    isSubmitting,
    pelangganTipe,
    setPelangganTipe,
    selectedProductId,
    activeProduct,
    qty,
    hargaSatuan,
    metodeBayar,
    setMetodeBayar,
    statusBayar,
    setStatusBayar,
    extraCartItems,
    formErrors,
    filterSegmen,
    setFilterSegmen,
    detailTrx,
    setDetailTrx,
    marginSummary,
    filteredTransactions,
    nextTrxId,
    handleProductChange,
    handleQtyChange,
    handlePriceChange,
    handleAddExtraItem,
    handleRemoveExtraItem,
    handleSubmitTransaction,
  } = usePosFeature();

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section
      className={cn(!embedded && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}
    >
      <PageHeader
        as={HeadingTag}
        title="Kasir"
        description="Catat penjualan B2G, B2B, dan B2C, lalu lihat margin sebelum menyimpan."
      />

      <form onSubmit={handleSubmitTransaction} noValidate>
        <Card padding="none" className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="space-y-6 p-5 sm:p-7 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-soga-700" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-forest-900">
                  Transaksi baru
                </h2>
              </div>
              <span className="rounded-md bg-canvas-100 px-2 py-0.5 text-xs font-medium text-forest-800">
                {nextTrxId}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-forest-900">Tipe pelanggan</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SEGMENT_OPTIONS.map((seg) => {
                  const isSelected = pelangganTipe === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setPelangganTipe(seg.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'min-h-14 rounded-xl border px-3 py-2.5 text-center transition-all',
                        isSelected
                          ? 'border-soga-900 bg-soga-900 text-canvas-50 shadow-sm'
                          : 'border-soga-400/70 bg-canvas-50 text-forest-900 hover:bg-canvas-100'
                      )}
                    >
                      <span className="block text-sm font-bold">{seg.title}</span>
                      <span
                        className={cn(
                          'block text-[11px]',
                          isSelected ? 'text-sage-200' : 'text-forest-800/75'
                        )}
                      >
                        {seg.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Select
                  id="pos-product"
                  label="Produk"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  error={formErrors.product}
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nama}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Input
                  id="pos-qty"
                  type="number"
                  min="0"
                  label="Jumlah"
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  suffix={activeProduct ? activeProduct.satuan : 'pcs'}
                  error={formErrors.qty}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <Input
                  id="pos-price"
                  type="number"
                  min="0"
                  step="1000"
                  label="Harga satuan"
                  prefix="Rp"
                  value={hargaSatuan}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  helperText={
                    activeProduct
                      ? `Harga katalog ${formatRupiah(activeProduct.harga_katalog)}. Boleh diubah untuk pesanan khusus.`
                      : ''
                  }
                  error={formErrors.harga}
                />
              </div>
              <div className="sm:col-span-7">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    id="pos-metode"
                    label="Metode bayar"
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value as PaymentMethod)}
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Tunai</option>
                  </Select>
                  <Select
                    id="pos-status"
                    label="Status bayar"
                    value={statusBayar}
                    onChange={(e) => setStatusBayar(e.target.value as PaymentStatusKey)}
                  >
                    <option value="lunas">Lunas (100%)</option>
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="belum_bayar">Belum Bayar</option>
                  </Select>
                </div>
                <p className="mt-1.5 text-[11px] text-forest-800/70">
                  Pembayaran dicatat manual, tidak lewat payment gateway.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-soga-600/50 bg-canvas-50 px-4 py-2.5">
              <p className="text-xs text-forest-800/80">
                Lebih dari satu produk dalam satu nota?
              </p>
              <Button variant="outline" size="sm" onClick={handleAddExtraItem}>
                <Plus className="h-4 w-4" />
                <span>Tambah Item</span>
              </Button>
            </div>

            {extraCartItems.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-soga-400/50 bg-canvas-50 p-3">
                <p className="text-sm font-medium text-forest-900">
                  Item tambahan ({extraCartItems.length})
                </p>
                {extraCartItems.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-forest-900">{item.nama}</p>
                      <p className="tabular-nums text-forest-800">
                        {item.qty} {item.satuan} × {formatRupiah(item.harga_satuan)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraItem(idx)}
                      aria-label={`Hapus ${item.nama}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <PosMarginPanel marginSummary={marginSummary} isSubmitting={isSubmitting} />
        </div>
        </Card>
      </form>

      {!embedded ? (
        <PosTransactionHistory
          transactions={filteredTransactions}
          isLoading={isLoadingData}
          filterSegmen={filterSegmen}
          onChangeFilterSegmen={setFilterSegmen}
          onSelectDetail={setDetailTrx}
        />
      ) : null}

      <Modal
        isOpen={Boolean(detailTrx)}
        onClose={() => setDetailTrx(null)}
        title={detailTrx ? `Detail Transaksi ${detailTrx.id}` : ''}
      >
        {detailTrx ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soga">Segmen: {detailTrx.pelanggan_tipe}</Badge>
              <Badge variant="sage">Metode: {detailTrx.metode_bayar}</Badge>
              <Badge variant={getPaymentStatusMeta(detailTrx.status_bayar).badgeVariant}>
                Status: {getPaymentStatusMeta(detailTrx.status_bayar).label}
              </Badge>
            </div>
            <div className="space-y-2 rounded-xl border border-soga-400/50 bg-white p-3.5">
              {(detailTrx.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 border-b border-canvas-200 pb-2 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-forest-900">
                      {item.nama || item.product_id}
                    </p>
                    <p className="text-xs tabular-nums text-forest-800">
                      {item.qty} × {formatRupiah(item.harga_satuan)} (HPP{' '}
                      {formatRupiah(item.hpp_snapshot)})
                    </p>
                  </div>
                  <p className="font-sans font-bold tabular-nums text-forest-900">
                    {formatRupiah(item.qty * item.harga_satuan)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between rounded-xl bg-canvas-100 p-3.5 font-semibold">
              <span>Total (laba kotor)</span>
              <span className="font-sans font-bold tabular-nums text-forest-900">
                {formatRupiah(detailTrx.total)} (+{formatRupiah(detailTrx.margin_nominal)})
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
export default PosPage;
