import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  ListFilter,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { createTransaction, getProducts, getTransactions } from '../api/services/posService';
import { formatPercent, formatRupiah, formatTanggalShort } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';

const SEGMENT_OPTIONS = [
  { id: 'B2G', title: 'B2G', desc: 'Dinas / Instansi / ASN' },
  { id: 'B2B', title: 'B2B', desc: 'Sekolah / Perusahaan' },
  { id: 'B2C', title: 'B2C', desc: 'Kolektor / Galeri' },
];

const PAYMENT_STATUS_ORDER = {
  lunas: 0,
  DP: 1,
  belum_bayar: 2,
};

const PAYMENT_STATUS_GROUPS = [
  { key: 'lunas', label: 'Lunas', badgeVariant: 'sage' },
  { key: 'DP', label: 'DP', badgeVariant: 'warning' },
  { key: 'belum_bayar', label: 'Belum Bayar', badgeVariant: 'danger' },
];

function normalizePaymentStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'lunas' || raw === 'paid') return 'lunas';
  if (raw === 'dp' || raw.includes('uang muka')) return 'DP';
  return 'belum_bayar';
}

function getPaymentStatusMeta(status) {
  const key = normalizePaymentStatus(status);
  return PAYMENT_STATUS_GROUPS.find((g) => g.key === key) || PAYMENT_STATUS_GROUPS[0];
}

export function PosPage({ embedded = false }) {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State form keranjang transaksi (default sesuai contoh Component 1.png)
  const [pelangganTipe, setPelangganTipe] = useState('B2G');
  const [selectedProductId, setSelectedProductId] = useState('PRD-01');
  const [qty, setQty] = useState(12);
  const [hargaSatuan, setHargaSatuan] = useState(385000);
  const [metodeBayar, setMetodeBayar] = useState('transfer');
  const [statusBayar, setStatusBayar] = useState('lunas');
  const [extraCartItems, setExtraCartItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [filterSegmen, setFilterSegmen] = useState('ALL');
  const [detailTrx, setDetailTrx] = useState(null);

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const desktopRowRefs = useRef([]);
  const mobileCardRefs = useRef([]);
  const programmaticSpyRef = useRef(null);
  const [activeSpyRow, setActiveSpyRow] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoadingData(true);
    Promise.all([getProducts(), getTransactions()])
      .then(([prodRes, trxRes]) => {
        if (!active) return;
        setProducts(prodRes.data || []);
        setTransactions(trxRes.data || []);
      })
      .catch((err) => {
        if (active) showToast(err.message, 'error');
      })
      .finally(() => {
        if (active) setIsLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const handleProductChange = (newId) => {
    setSelectedProductId(newId);
    const found = products.find((p) => p.id === newId);
    if (found) {
      setHargaSatuan(found.harga_katalog);
    }
    setFormErrors((prev) => ({ ...prev, product: '', qty: '' }));
  };

  // Gabungan item utama + item tambahan keranjang
  const allCartItems = useMemo(() => {
    const items = [...extraCartItems];
    if (activeProduct && Number(qty) > 0) {
      const hppSnapshot =
        activeProduct.id === 'PRD-01' ? 235000 : activeProduct.hpp_default || 0;
      items.unshift({
        product_id: activeProduct.id,
        nama: activeProduct.nama,
        satuan: activeProduct.satuan,
        qty: Number(qty),
        harga_satuan: Number(hargaSatuan) || 0,
        hpp_snapshot: hppSnapshot,
      });
    }
    return items;
  }, [activeProduct, extraCartItems, hargaSatuan, qty]);

  const marginSummary = useMemo(() => {
    const totalPenjualan = allCartItems.reduce(
      (sum, it) => sum + it.qty * it.harga_satuan,
      0
    );
    const totalHpp = allCartItems.reduce(
      (sum, it) => sum + it.qty * it.hpp_snapshot,
      0
    );
    const labaKotor = totalPenjualan - totalHpp;
    const marginPersen = totalPenjualan > 0 ? (labaKotor / totalPenjualan) * 100 : 0;
    const totalUnit = allCartItems.reduce((sum, it) => sum + it.qty, 0);

    return {
      totalPenjualan,
      totalHpp,
      labaKotor,
      marginPersen,
      totalUnit,
      isHealthy: marginPersen >= 20,
      isLoss: labaKotor < 0,
    };
  }, [allCartItems]);

  const handleAddExtraItem = () => {
    if (!activeProduct || Number(qty) <= 0) {
      setFormErrors({ qty: 'Jumlah produk harus lebih besar dari 0.' });
      return;
    }
    const hppSnapshot =
      activeProduct.id === 'PRD-01' ? 235000 : activeProduct.hpp_default || 0;
    setExtraCartItems((prev) => [
      ...prev,
      {
        product_id: activeProduct.id,
        nama: activeProduct.nama,
        satuan: activeProduct.satuan,
        qty: Number(qty),
        harga_satuan: Number(hargaSatuan) || 0,
        hpp_snapshot: hppSnapshot,
      },
    ]);
    setQty(1);
    showToast('Item ditambahkan ke daftar keranjang.', 'success', 2200);
  };

  const validatePosForm = () => {
    const errors = {};
    if (!activeProduct && extraCartItems.length === 0) {
      errors.product = 'Pilih produk batik terlebih dahulu.';
    }
    if (extraCartItems.length === 0 && (Number(qty) <= 0 || Number.isNaN(Number(qty)))) {
      errors.qty = 'Jumlah (Qty) wajib lebih dari 0.';
    }
    if (Number(hargaSatuan) <= 0 && extraCartItems.length === 0) {
      errors.harga = 'Harga satuan harus lebih besar dari Rp0.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!validatePosForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tanggal: new Date().toISOString().slice(0, 10),
        pelanggan_tipe: pelangganTipe,
        metode_bayar: metodeBayar,
        status_bayar: statusBayar,
        total: marginSummary.totalPenjualan,
        items: allCartItems,
      };
      const res = await createTransaction(payload);
      setTransactions((prev) => [res.data, ...prev]);
      setExtraCartItems([]);
      setQty(1);
      if (activeProduct) {
        setHargaSatuan(activeProduct.harga_katalog);
      }
      showToast(
        res.message ||
        `Transaksi ${pelangganTipe} tersimpan dengan margin ${formatPercent(
          marginSummary.marginPersen,
          true
        )}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan transaksi POS.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const base =
      filterSegmen === 'ALL'
        ? [...transactions]
        : transactions.filter((t) => t.pelanggan_tipe === filterSegmen);

    return base.sort(
      (a, b) =>
        (PAYMENT_STATUS_ORDER[normalizePaymentStatus(a.status_bayar)] ?? 99) -
        (PAYMENT_STATUS_ORDER[normalizePaymentStatus(b.status_bayar)] ?? 99)
    );
  }, [filterSegmen, transactions]);

  const isScrollspyActive = filteredTransactions.length > 10;

  const scrollspyGroups = useMemo(() => {
    if (!isScrollspyActive) return [];
    return PAYMENT_STATUS_GROUPS.map((group) => {
      let startIdx = -1;
      let count = 0;
      filteredTransactions.forEach((trx, idx) => {
        if (normalizePaymentStatus(trx.status_bayar) === group.key) {
          if (startIdx === -1) startIdx = idx;
          count += 1;
        }
      });
      return {
        ...group,
        startIdx,
        count,
      };
    });
  }, [filteredTransactions, isScrollspyActive]);

  const activeSpyGroupKey = useMemo(() => {
    const activeTrx = filteredTransactions[activeSpyRow] || filteredTransactions[0];
    return activeTrx ? normalizePaymentStatus(activeTrx.status_bayar) : 'lunas';
  }, [activeSpyRow, filteredTransactions]);

  useEffect(() => {
    programmaticSpyRef.current = null;
    setActiveSpyRow(0);
    setScrollProgress(0);
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
    if (mobileScrollRef.current) mobileScrollRef.current.scrollTop = 0;
  }, [filterSegmen, filteredTransactions.length]);

  const clearProgrammaticSpy = () => {
    programmaticSpyRef.current = null;
  };

  const handleContainerScroll = (e, isDesktop) => {
    if (!isScrollspyActive) return;
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    setScrollProgress(
      maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0
    );

    if (programmaticSpyRef.current && Date.now() < programmaticSpyRef.current.until) {
      setActiveSpyRow(programmaticSpyRef.current.rowIndex);
      return;
    }
    programmaticSpyRef.current = null;

    if (maxScroll > 0 && scrollTop >= maxScroll - 8) {
      setActiveSpyRow(filteredTransactions.length - 1);
      return;
    }

    const rowEls = isDesktop ? desktopRowRefs.current : mobileCardRefs.current;
    const containerTop = container.getBoundingClientRect().top;
    const stickyOffset = isDesktop ? 48 : 8;
    let foundIdx = 0;

    for (let i = 0; i < filteredTransactions.length; i += 1) {
      const el = rowEls[i];
      if (!el) continue;
      const dist = el.getBoundingClientRect().top - containerTop;
      if (dist <= stickyOffset + 20) {
        foundIdx = i;
      } else {
        break;
      }
    }
    setActiveSpyRow(foundIdx);
  };

  const scrollToRow = (rowIndex) => {
    if (rowIndex < 0) return;
    const isDesktopVisible =
      tableScrollRef.current && tableScrollRef.current.offsetParent !== null;
    const container = isDesktopVisible ? tableScrollRef.current : mobileScrollRef.current;
    const targetEl = isDesktopVisible
      ? desktopRowRefs.current[rowIndex]
      : mobileCardRefs.current[rowIndex];

    programmaticSpyRef.current = { rowIndex, until: Date.now() + 700 };
    setActiveSpyRow(rowIndex);

    if (container && targetEl) {
      const containerTop = container.getBoundingClientRect().top;
      const elTop = targetEl.getBoundingClientRect().top;
      const stickyOffset = isDesktopVisible ? 44 : 0;
      const nextTop = container.scrollTop + (elTop - containerTop) - stickyOffset;
      container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    }
  };

  const nextTrxId = `TRX-202605-${String(transactions.length + 87).padStart(3, '0')}`;

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={embedded ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'}>
      <div className="mb-6 max-w-2xl space-y-1.5">
        <HeadingTag className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
          Kasir Cepat &amp; Penentuan Margin Instan
        </HeadingTag>
        <p className="text-sm leading-relaxed text-forest-800/85 sm:text-base">
          Catat pesanan instansi (B2G), korporasi (B2B), dan ritel (B2C). Harga katalog dapat disesuaikan untuk pesanan kustom dengan pemantauan margin langsung terhadap snapshot HPP.
        </p>
      </div>

      {/* Kartu Utama POS */}
      <form
        onSubmit={handleSubmitTransaction}
        noValidate
        className="overflow-hidden rounded-2xl border border-soga-600/40 bg-white shadow-card"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Kolom Kiri: Form Keranjang Transaksi */}
          <div className="space-y-6 p-5 sm:p-7 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-900">
                <ShoppingBag className="h-4 w-4 text-soga-700" />
                <span>Keranjang Transaksi Baru</span>
              </div>
              <span className="text-xs font-semibold text-soga-700">ID: {nextTrxId}</span>
            </div>

            {/* Segmen / Tipe Pelanggan */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-forest-900">Segmen / Tipe Pelanggan</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SEGMENT_OPTIONS.map((seg) => {
                  const active = pelangganTipe === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setPelangganTipe(seg.id)}
                      className={`min-h-14 rounded-xl border px-3 py-2.5 text-center transition-all ${active
                          ? 'border-soga-900 bg-soga-900 text-canvas-50 shadow-sm'
                          : 'border-soga-400/70 bg-canvas-50 text-forest-900 hover:bg-canvas-100'
                        }`}
                    >
                      <span className="block text-sm font-bold">{seg.title}</span>
                      <span
                        className={`block text-[11px] ${active ? 'text-sage-200' : 'text-forest-800/75'
                          }`}
                      >
                        {seg.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pemilih Produk & Jumlah */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Select
                  id="pos-product"
                  label="Pilih Produk Azrya"
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
                  label="Jumlah (Qty)"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    setFormErrors((prev) => ({ ...prev, qty: '' }));
                  }}
                  suffix={activeProduct ? activeProduct.satuan : 'pcs'}
                  error={formErrors.qty}
                />
              </div>
            </div>

            {/* Harga Satuan & Metode/Status Bayar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <Input
                  id="pos-price"
                  type="number"
                  min="0"
                  step="1000"
                  label="Harga Satuan (Dapat Diedit)"
                  prefix="Rp"
                  value={hargaSatuan}
                  onChange={(e) => {
                    setHargaSatuan(e.target.value);
                    setFormErrors((prev) => ({ ...prev, harga: '' }));
                  }}
                  helperText={
                    activeProduct
                      ? `Katalog Standar: ${formatRupiah(activeProduct.harga_katalog)}`
                      : ''
                  }
                  error={formErrors.harga}
                />
              </div>
              <div className="sm:col-span-7">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    id="pos-metode"
                    label="Metode Bayar"
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value)}
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Tunai</option>
                  </Select>
                  <Select
                    id="pos-status"
                    label="Status Bayar"
                    value={statusBayar}
                    onChange={(e) => setStatusBayar(e.target.value)}
                  >
                    <option value="lunas">Lunas (100%)</option>
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="belum_bayar">Belum Bayar</option>
                  </Select>
                </div>
                <p className="mt-1.5 text-[11px] text-forest-800/70">
                  Pencatatan status kas manual non-payment gateway.
                </p>
              </div>
            </div>

            {/* Opsi Tambah Baris Keranjang */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-soga-600/50 bg-canvas-50 px-4 py-2.5">
              <p className="text-xs text-forest-800/80">
                Perlu mencatat lebih dari satu produk dalam satu nota?
              </p>
              <Button variant="outline" size="sm" onClick={handleAddExtraItem}>
                <Plus className="h-4 w-4" />
                <span>Tambah Item</span>
              </Button>
            </div>

            {extraCartItems.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-soga-400/50 bg-canvas-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-soga-700">
                  Item Tambahan di Keranjang ({extraCartItems.length})
                </p>
                {extraCartItems.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-forest-900">{item.nama}</p>
                      <p className="text-forest-800/75">
                        {item.qty} {item.satuan} × {formatRupiah(item.harga_satuan)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExtraCartItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label={`Hapus ${item.nama}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Kolom Kanan: Panel Perhitungan Margin POS */}
          <div className="flex flex-col justify-between border-t border-soga-600/30 bg-canvas-100/70 p-5 sm:p-7 lg:col-span-5 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                  Perhitungan Margin POS
                </p>
                <Badge
                  variant={
                    marginSummary.isLoss
                      ? 'danger'
                      : marginSummary.isHealthy
                        ? 'sage'
                        : 'warning'
                  }
                >
                  {marginSummary.isLoss
                    ? `Rugi ${formatPercent(marginSummary.marginPersen)}`
                    : `Margin ${marginSummary.isHealthy ? 'Sehat' : 'Tipis'} ${formatPercent(
                      marginSummary.marginPersen,
                      true
                    )}`}
                </Badge>
              </div>

              <div className="space-y-3 border-b border-soga-600/30 pb-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-forest-800/85">
                    Total Penjualan Masuk ({marginSummary.totalUnit} unit):
                  </span>
                  <span className="font-bold text-forest-900">
                    {formatRupiah(marginSummary.totalPenjualan)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-forest-800/85">Snapshot HPP Modal:</span>
                  <span className="font-semibold text-red-700">
                    - {formatRupiah(marginSummary.totalHpp)}
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                    Estimasi Laba Kotor
                  </p>
                  <p className="text-[11px] text-forest-800/75">
                    Sebelum beban operasional toko
                  </p>
                </div>
                <p
                  className={`font-display text-xl font-bold ${marginSummary.isLoss ? 'text-red-700' : 'text-sage-600'
                    }`}
                >
                  {marginSummary.labaKotor >= 0 ? '+ ' : ''}
                  {formatRupiah(marginSummary.labaKotor)}
                </p>
              </div>

              <div className="rounded-xl border border-sage-400/60 bg-sage-200/35 px-3.5 py-2.5 text-xs text-forest-900">
                <span className="font-semibold">Info Kasir:</span> Margin dihitung langsung dari snapshot resep HPP terbaru produk terkait.
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}

                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan Transaksi Kasir</span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Riwayat Transaksi Kasir */}
      {!embedded ? (
        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Riwayat Transaksi Kasir
            </h2>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'B2G', 'B2B', 'B2C'].map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setFilterSegmen(seg)}
                  className={`min-h-10 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${filterSegmen === seg
                      ? 'border-forest-900 bg-forest-900 text-canvas-50'
                      : 'border-soga-400/70 bg-white text-forest-900 hover:bg-canvas-100'
                    }`}
                >
                  {seg === 'ALL' ? 'Semua Segmen' : seg}
                </button>
              ))}
            </div>
          </div>

          {isLoadingData ? (
            <TableSkeleton rows={3} />
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-soga-600/50 bg-white p-8 text-center">
              <p className="text-sm font-medium text-forest-800">
                Belum ada transaksi tercatat pada filter segmen ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Navigasi Scrollspy aktif otomatis ketika data melebihi 10 baris */}
              {isScrollspyActive ? (
                <div className="overflow-hidden rounded-xl border border-soga-600/35 bg-canvas-100/90 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-forest-900">
                      <ListFilter className="h-3.5 w-3.5 shrink-0 text-soga-900" aria-hidden="true" />
                      <span>
                        <strong>Baris {activeSpyRow + 1}</strong> dari {filteredTransactions.length}{' '}
                        <span className="text-forest-800/75">
                          ({filteredTransactions[activeSpyRow]?.id || '-'})
                        </span>
                      </span>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-1.5"
                      role="navigation"
                      aria-label="Navigasi Scrollspy status pembayaran transaksi"
                    >
                      {scrollspyGroups.map((group) => {
                        const isActiveGroup = activeSpyGroupKey === group.key;
                        const isDisabled = group.count === 0;
                        return (
                          <button
                            key={group.key}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => scrollToRow(group.startIdx)}
                            aria-current={isActiveGroup ? 'location' : undefined}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isActiveGroup
                                ? 'border-forest-900 bg-forest-900 text-canvas-50 shadow-sm'
                                : 'border-soga-400/60 bg-white text-forest-800 hover:bg-canvas-50'
                            } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            {group.label}{' '}
                            <span
                              className={`ml-1 text-[11px] ${
                                isActiveGroup ? 'text-sage-200' : 'text-forest-800/65'
                              }`}
                            >
                              ({group.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="h-1 w-full bg-canvas-200">
                    <div
                      className="h-full bg-soga-700 transition-all duration-150"
                      style={{ width: `${Math.max(8, scrollProgress)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Tampilan Tabel Desktop */}
              <div
                ref={tableScrollRef}
                onScroll={(e) => handleContainerScroll(e, true)}
                onWheel={clearProgrammaticSpy}
                onTouchMove={clearProgrammaticSpy}
                onPointerDown={clearProgrammaticSpy}
                className={`hidden rounded-2xl border border-soga-600/35 bg-white shadow-soft md:block ${
                  isScrollspyActive
                    ? 'max-h-[440px] overflow-x-auto overflow-y-auto scroll-smooth'
                    : 'overflow-hidden'
                }`}
              >
                <table className="w-full text-left text-sm">
                  <thead
                    className={`border-b border-canvas-200 text-xs font-semibold uppercase tracking-wider text-forest-800 ${
                      isScrollspyActive
                        ? 'sticky top-0 z-10 bg-canvas-100 shadow-sm'
                        : 'bg-canvas-100/70'
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3">ID &amp; Tanggal</th>
                      <th className="px-4 py-3">Segmen</th>
                      <th className="px-4 py-3">Pembayaran</th>
                      <th className="px-4 py-3">Total &amp; Margin</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-canvas-200">
                    {filteredTransactions.map((trx, idx) => {
                      const isSpyRow = isScrollspyActive && idx === activeSpyRow;
                      const statusMeta = getPaymentStatusMeta(trx.status_bayar);
                      return (
                        <tr
                          key={trx.id}
                          ref={(el) => {
                            desktopRowRefs.current[idx] = el;
                          }}
                          className={`transition-colors hover:bg-canvas-50 ${
                            isSpyRow ? 'bg-canvas-100/70' : ''
                          }`}
                        >
                          <td
                            className={`px-4 py-3 ${
                              isSpyRow ? 'border-l-4 border-l-soga-700' : ''
                            }`}
                          >
                            <p className="font-semibold text-forest-900">{trx.id}</p>
                            <p className="text-xs text-forest-800/75">
                              {formatTanggalShort(trx.tanggal)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="soga">{trx.pelanggan_tipe}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize">{trx.metode_bayar}</span> •{' '}
                            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-forest-900">{formatRupiah(trx.total)}</p>
                            <p className="text-xs font-medium text-sage-600">
                              Margin {formatRupiah(trx.margin_nominal)} ({formatPercent(trx.margin_persen)})
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailTrx(trx)}
                            >
                              <Eye className="h-4 w-4" />
                              <span>Detail</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Stacked Cards Mobile */}
              <div
                ref={mobileScrollRef}
                onScroll={(e) => handleContainerScroll(e, false)}
                onWheel={clearProgrammaticSpy}
                onTouchMove={clearProgrammaticSpy}
                onPointerDown={clearProgrammaticSpy}
                className={`space-y-3 md:hidden ${
                  isScrollspyActive ? 'max-h-[440px] overflow-y-auto scroll-smooth pr-1' : ''
                }`}
              >
                {filteredTransactions.map((trx, idx) => {
                  const isSpyRow = isScrollspyActive && idx === activeSpyRow;
                  const statusMeta = getPaymentStatusMeta(trx.status_bayar);
                  return (
                    <div
                      key={trx.id}
                      ref={(el) => {
                        mobileCardRefs.current[idx] = el;
                      }}
                      className={`rounded-xl border bg-white p-4 shadow-soft transition-colors ${
                        isSpyRow
                          ? 'border-soga-700 bg-canvas-50'
                          : 'border-soga-600/35'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-forest-900">{trx.id}</p>
                          <p className="text-xs text-forest-800/75">
                            {formatTanggalShort(trx.tanggal)} • {trx.metode_bayar}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Badge variant="soga">{trx.pelanggan_tipe}</Badge>
                          <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-canvas-200 pt-3">
                        <div>
                          <p className="text-base font-bold text-forest-900">
                            {formatRupiah(trx.total)}
                          </p>
                          <p className="text-xs text-sage-600">
                            Laba kotor {formatRupiah(trx.margin_nominal)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setDetailTrx(trx)}>
                          Detail
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal Detail Transaksi */}
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
                    <p className="font-semibold text-forest-900">{item.nama || item.product_id}</p>
                    <p className="text-xs text-forest-800/75">
                      {item.qty} × {formatRupiah(item.harga_satuan)} (HPP Snapshot:{' '}
                      {formatRupiah(item.hpp_snapshot)})
                    </p>
                  </div>
                  <p className="font-bold text-forest-900">
                    {formatRupiah(item.qty * item.harga_satuan)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between rounded-xl bg-canvas-100 p-3.5 font-semibold">
              <span>Total &amp; Margin Laba Kotor</span>
              <span className="text-soga-900">
                {formatRupiah(detailTrx.total)} (+{formatRupiah(detailTrx.margin_nominal)})
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
