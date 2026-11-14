import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BUSINESS_CONSTANTS,
  PAYMENT_STATUS_GROUPS,
  PAYMENT_STATUS_ORDER,
} from '../../constants';
import { useToast } from '../../hooks/useToast';
import { isRequestCanceled } from '../../services/apiClient';
import { createTransaction, getProducts, getTransactions } from '../../services/posService';
import type {
  CartItem,
  CustomerSegment,
  MarginSummary,
  PaymentMethod,
  PaymentStatusKey,
  Product,
  ScrollspyGroupConfig,
  Transaction,
} from '../../types';
import { formatPercent } from '../../utils/formatters';

export type SegmentFilter = 'ALL' | CustomerSegment;

interface PosFormErrors {
  product?: string;
  qty?: string;
  harga?: string;
}

export function normalizePaymentStatus(status: string): PaymentStatusKey {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'lunas' || raw === 'paid') return 'lunas';
  if (raw === 'dp' || raw.includes('uang muka')) return 'DP';
  return 'belum_bayar';
}

export function getPaymentStatusMeta(
  status: string
): ScrollspyGroupConfig<PaymentStatusKey> {
  const key = normalizePaymentStatus(status);
  return PAYMENT_STATUS_GROUPS.find((g) => g.key === key) || PAYMENT_STATUS_GROUPS[0];
}

function getHppSnapshot(product: Product): number {
  return product.id === 'PRD-01'
    ? BUSINESS_CONSTANTS.PRD01_HPP_SNAPSHOT
    : product.hpp_default || 0;
}

export function usePosFeature() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pelangganTipe, setPelangganTipe] = useState<CustomerSegment>('B2G');
  const [selectedProductId, setSelectedProductId] = useState('PRD-01');
  const [qty, setQty] = useState<number | string>(12);
  const [hargaSatuan, setHargaSatuan] = useState<number | string>(385000);
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>('transfer');
  const [statusBayar, setStatusBayar] = useState<PaymentStatusKey>('lunas');
  const [extraCartItems, setExtraCartItems] = useState<CartItem[]>([]);
  const [formErrors, setFormErrors] = useState<PosFormErrors>({});
  const [filterSegmen, setFilterSegmen] = useState<SegmentFilter>('ALL');
  const [detailTrx, setDetailTrx] = useState<Transaction | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingData(true);

    Promise.all([getProducts(controller.signal), getTransactions(controller.signal)])
      .then(([prodRes, trxRes]) => {
        if (controller.signal.aborted) return;
        setProducts(prodRes.data || []);
        setTransactions(trxRes.data || []);
      })
      .catch((err) => {
        if (controller.signal.aborted || isRequestCanceled(err)) return;
        showToast(err instanceof Error ? err.message : 'Gagal memuat data kasir.', 'error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingData(false);
      });

    return () => {
      controller.abort();
    };
  }, [showToast]);

  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const handleProductChange = useCallback(
    (newId: string) => {
      setSelectedProductId(newId);
      const found = products.find((p) => p.id === newId);
      if (found) {
        setHargaSatuan(found.harga_katalog);
      }
      setFormErrors((prev) => ({ ...prev, product: '', qty: '' }));
    },
    [products]
  );

  const handleQtyChange = useCallback((value: number | string) => {
    setQty(value);
    setFormErrors((prev) => ({ ...prev, qty: '' }));
  }, []);

  const handlePriceChange = useCallback((value: number | string) => {
    setHargaSatuan(value);
    setFormErrors((prev) => ({ ...prev, harga: '' }));
  }, []);

  const allCartItems = useMemo<CartItem[]>(() => {
    const items = [...extraCartItems];
    if (activeProduct && Number(qty) > 0) {
      items.unshift({
        product_id: activeProduct.id,
        nama: activeProduct.nama,
        satuan: activeProduct.satuan,
        qty: Number(qty),
        harga_satuan: Number(hargaSatuan) || 0,
        hpp_snapshot: getHppSnapshot(activeProduct),
      });
    }
    return items;
  }, [activeProduct, extraCartItems, hargaSatuan, qty]);

  const marginSummary = useMemo<MarginSummary>(() => {
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
      isHealthy: marginPersen >= BUSINESS_CONSTANTS.HEALTHY_MARGIN_PCT,
      isLoss: labaKotor < 0,
    };
  }, [allCartItems]);

  const handleAddExtraItem = useCallback(() => {
    if (!activeProduct || Number(qty) <= 0) {
      setFormErrors({ qty: 'Jumlah produk harus lebih besar dari 0.' });
      return;
    }
    setExtraCartItems((prev) => [
      ...prev,
      {
        product_id: activeProduct.id,
        nama: activeProduct.nama,
        satuan: activeProduct.satuan,
        qty: Number(qty),
        harga_satuan: Number(hargaSatuan) || 0,
        hpp_snapshot: getHppSnapshot(activeProduct),
      },
    ]);
    setQty(1);
    showToast('Item ditambahkan ke daftar keranjang.', 'success', 2200);
  }, [activeProduct, hargaSatuan, qty, showToast]);

  const handleRemoveExtraItem = useCallback((index: number) => {
    setExtraCartItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validatePosForm = useCallback(() => {
    const errors: PosFormErrors = {};
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
  }, [activeProduct, extraCartItems.length, hargaSatuan, qty]);

  const handleSubmitTransaction = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validatePosForm()) return;

      setIsSubmitting(true);
      try {
        const res = await createTransaction({
          tanggal: new Date().toISOString().slice(0, 10),
          pelanggan_tipe: pelangganTipe,
          metode_bayar: metodeBayar,
          status_bayar: statusBayar,
          total: marginSummary.totalPenjualan,
          items: allCartItems,
        });
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
        showToast(
          err instanceof Error ? err.message : 'Gagal menyimpan transaksi POS.',
          'error'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      activeProduct,
      allCartItems,
      marginSummary.marginPersen,
      marginSummary.totalPenjualan,
      metodeBayar,
      pelangganTipe,
      showToast,
      statusBayar,
      validatePosForm,
    ]
  );

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

  const nextTrxId = `TRX-202605-${String(transactions.length + 87).padStart(3, '0')}`;

  return {
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
  };
}
