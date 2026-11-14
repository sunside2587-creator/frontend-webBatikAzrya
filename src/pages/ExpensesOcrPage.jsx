import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  FileWarning,
  Info,
  ListFilter,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  createExpense,
  getExpenses,
  getMaterials,
  scanReceiptOcr,
} from '../api/services/expenseService';
import { formatRupiah, formatTanggalShort } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input, NumberInput, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SkeletonBox, TableSkeleton } from '../components/ui/Skeleton';

const INITIAL_OCR_DRAFT = {
  toko: 'Toko Kimia & Bahan Batik Sumber Malam',
  tanggal: '2026-05-18',
  kategori: 'bahan',
  sumber: 'ocr',
  confidence: 0.74,
  needs_verification: true,
  bukti_url: '/assets/corak_batikHitam.jpg',
  items: [
    {
      nama_item: 'Kain Mori Primissima',
      material_id: 'MAT-01',
      qty: 15,
      satuan: 'meter',
      harga_per_satuan: 36000,
      needs_correction: false,
    },
    {
      nama_item: 'Lilin Malam Klowong Super',
      material_id: 'MAT-02',
      qty: 5,
      satuan: 'kg',
      harga_per_satuan: 48000,
      needs_correction: true,
    },
  ],
};

const EXPENSE_CATEGORY_ORDER = {
  bahan: 0,
  alat: 1,
  operasional: 2,
};

const EXPENSE_CATEGORY_GROUPS = [
  { key: 'bahan', label: 'Bahan Baku', badgeVariant: 'soga' },
  { key: 'alat', label: 'Alat Produksi', badgeVariant: 'forest' },
  { key: 'operasional', label: 'Operasional', badgeVariant: 'neutral' },
];

function normalizeExpenseCategory(kategori) {
  const raw = String(kategori || '').trim().toLowerCase();
  if (raw.includes('bahan')) return 'bahan';
  if (raw.includes('alat')) return 'alat';
  return 'operasional';
}

function getExpenseCategoryMeta(kategori) {
  const key = normalizeExpenseCategory(kategori);
  return EXPENSE_CATEGORY_GROUPS.find((g) => g.key === key) || EXPENSE_CATEGORY_GROUPS[2];
}

export function ExpensesOcrPage({ embedded = false }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const expenseScrollRef = useRef(null);
  const expenseItemRefs = useRef([]);
  const programmaticSpyRef = useRef(null);

  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState('ocr'); // 'ocr' | 'manual'
  const [ocrErrorBanner, setOcrErrorBanner] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [draft, setDraft] = useState(INITIAL_OCR_DRAFT);
  const [userConfirmedLowConf, setUserConfirmedLowConf] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState('');
  const [activeSpyIndex, setActiveSpyIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoadingList(true);
    Promise.all([getMaterials(), getExpenses()])
      .then(([matRes, expRes]) => {
        if (!active) return;
        setMaterials(matRes.data || []);
        setExpenses(expRes.data || []);
      })
      .catch((err) => {
        if (active) showToast(err.message, 'error');
      })
      .finally(() => {
        if (active) setIsLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const totalDraft = useMemo(() => {
    return draft.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.harga_per_satuan) || 0),
      0
    );
  }, [draft.items]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) =>
        (EXPENSE_CATEGORY_ORDER[normalizeExpenseCategory(a.kategori)] ?? 99) -
        (EXPENSE_CATEGORY_ORDER[normalizeExpenseCategory(b.kategori)] ?? 99)
    );
  }, [expenses]);

  const isScrollspyActive = sortedExpenses.length > 10;

  const scrollspyGroups = useMemo(() => {
    if (!isScrollspyActive) return [];
    return EXPENSE_CATEGORY_GROUPS.map((group) => {
      let startIdx = -1;
      let count = 0;
      sortedExpenses.forEach((exp, idx) => {
        if (normalizeExpenseCategory(exp.kategori) === group.key) {
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
  }, [isScrollspyActive, sortedExpenses]);

  const activeSpyGroupKey = useMemo(() => {
    const activeExp = sortedExpenses[activeSpyIndex] || sortedExpenses[0];
    return activeExp ? normalizeExpenseCategory(activeExp.kategori) : 'bahan';
  }, [activeSpyIndex, sortedExpenses]);

  useEffect(() => {
    programmaticSpyRef.current = null;
    setActiveSpyIndex(0);
    setScrollProgress(0);
    if (expenseScrollRef.current) {
      expenseScrollRef.current.scrollTop = 0;
    }
  }, [sortedExpenses.length]);

  const clearProgrammaticSpy = () => {
    programmaticSpyRef.current = null;
  };

  const handleExpenseScroll = (e) => {
    if (!isScrollspyActive) return;
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    setScrollProgress(
      maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0
    );

    if (programmaticSpyRef.current && Date.now() < programmaticSpyRef.current.until) {
      setActiveSpyIndex(programmaticSpyRef.current.rowIndex);
      return;
    }
    programmaticSpyRef.current = null;

    if (maxScroll > 0 && scrollTop >= maxScroll - 8) {
      setActiveSpyIndex(sortedExpenses.length - 1);
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    let foundIdx = 0;
    for (let i = 0; i < sortedExpenses.length; i += 1) {
      const el = expenseItemRefs.current[i];
      if (!el) continue;
      const dist = el.getBoundingClientRect().top - containerTop;
      if (dist <= 24) {
        foundIdx = i;
      } else {
        break;
      }
    }
    setActiveSpyIndex(foundIdx);
  };

  const scrollToExpenseRow = (rowIndex) => {
    if (rowIndex < 0) return;
    const container = expenseScrollRef.current;
    const targetEl = expenseItemRefs.current[rowIndex];

    programmaticSpyRef.current = { rowIndex, until: Date.now() + 700 };
    setActiveSpyIndex(rowIndex);

    if (container && targetEl) {
      const containerTop = container.getBoundingClientRect().top;
      const elTop = targetEl.getBoundingClientRect().top;
      const nextTop = container.scrollTop + (elTop - containerTop);
      container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar nota (JPG atau PNG).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 5 MB agar pembacaan OCR tetap cepat.', 'error');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewImageUrl(localUrl);
    await runOcrScan(file, 'low_confidence');
  };

  const runOcrScan = async (file, simulationMode) => {
    setIsScanning(true);
    setOcrErrorBanner('');
    setUserConfirmedLowConf(false);
    setMode('ocr');

    try {
      const res = await scanReceiptOcr(file, simulationMode);
      const d = res.data;
      setDraft({
        toko: d.toko || '',
        tanggal: d.tanggal || new Date().toISOString().slice(0, 10),
        kategori: d.kategori || 'bahan',
        sumber: 'ocr',
        confidence: d.confidence ?? 0.9,
        needs_verification: Boolean(d.needs_verification || d.code === 'OCR_LOW_CONFIDENCE'),
        bukti_url: d.bukti_url || previewImageUrl || '/assets/corak_batikHitam.jpg',
        items: (d.items || []).map((it) => ({
          nama_item: it.nama_item,
          material_id: it.material_id || '',
          qty: it.qty,
          satuan: it.satuan,
          harga_per_satuan: it.harga ?? it.harga_per_satuan ?? 0,
          needs_correction: Boolean(it.needs_correction),
        })),
      });

      if (d.needs_verification || res.code === 'OCR_LOW_CONFIDENCE') {
        showToast(
          'Hasil OCR memiliki skor kepercayaan rendah. Mohon periksa kolom bertanda Perlu Verifikasi.',
          'warning'
        );
      } else {
        showToast('Pembacaan nota OCR selesai dengan akurat.', 'success');
      }
    } catch (err) {
      // Fallback otomatis ke Input Manual sesuai US-03 Scenario 3
      setOcrErrorBanner(
        err.message ||
        'Layanan OCR mengalami timeout (AI_TIMEOUT). Mode Input Manual diaktifkan agar pencatatan tetap berjalan.'
      );
      setMode('manual');
      setDraft({
        toko: '',
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: 'bahan',
        sumber: 'manual',
        confidence: 1,
        needs_verification: false,
        bukti_url: previewImageUrl || '',
        items: [
          {
            nama_item: 'Kain Mori Primissima',
            material_id: 'MAT-01',
            qty: 10,
            satuan: 'meter',
            harga_per_satuan: 36000,
            needs_correction: false,
          },
        ],
      });
      showToast('OCR gagal. Form dialihkan ke Input Manual.', 'warning');
    } finally {
      setIsScanning(false);
    }
  };

  const switchToManualMode = () => {
    setMode('manual');
    setOcrErrorBanner('');
    setUserConfirmedLowConf(true);
    setDraft((prev) => ({
      ...prev,
      sumber: 'manual',
      needs_verification: false,
    }));
  };

  const updateItemField = (index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'material_id') {
          const mat = materials.find((m) => m.id === value);
          if (mat) {
            updated.nama_item = mat.nama;
            updated.satuan = mat.satuan;
          }
        }
        return updated;
      }),
    }));
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!draft.toko.trim()) {
      showToast('Nama toko atau pemasok wajib diisi.', 'error');
      return;
    }
    if (draft.needs_verification && !userConfirmedLowConf) {
      showToast(
        'Centang konfirmasi pemeriksaan nota terlebih dahulu karena skor OCR rendah.',
        'warning'
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        tanggal: draft.tanggal,
        toko: draft.toko.trim(),
        kategori: draft.kategori,
        total: totalDraft,
        sumber: mode === 'manual' ? 'manual' : 'ocr',
        confidence: draft.confidence,
        needs_verification: false,
        bukti_url: draft.bukti_url,
        items: draft.items.map((it) => ({
          ...it,
          qty: Number(it.qty) || 0,
          harga_per_satuan: Number(it.harga_per_satuan) || 0,
          subtotal: (Number(it.qty) || 0) * (Number(it.harga_per_satuan) || 0),
        })),
      };
      const res = await createExpense(payload);
      setExpenses((prev) => [res.data, ...prev]);
      const refreshedMaterials = await getMaterials();
      setMaterials(refreshedMaterials.data || []);
      showToast(
        res.message || 'Pengeluaran berhasil dicatat & harga bahan HPP diperbarui.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan data pengeluaran.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={embedded ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'}>
      <div className="mb-6 max-w-2xl space-y-1.5">
        <HeadingTag className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
          Dokumentasi Nota Digital &amp; Pembaruan Harga Bahan
        </HeadingTag>
        <p className="text-sm leading-relaxed text-forest-800/85 sm:text-base">
          Foto nota belanja bahan (kain mori, lilin malam, canting, pewarna) menggunakan kamera ponsel. Model OCR membaca nama toko, rincian item, dan memperbarui harga rata-rata bahan HPP.
        </p>
      </div>

      {ocrErrorBanner ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="flex-1">
            <p className="font-semibold">Layanan OCR Tidak Tersedia • Fallback Manual Aktif</p>
            <p className="mt-0.5">{ocrErrorBanner}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runOcrScan(null, 'high_confidence')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Panel Kiri: Pemindai Nota Kamera Ponsel */}
        <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
              Pemindai Nota Kamera Ponsel
            </p>
            <code className="rounded bg-canvas-100 px-2 py-0.5 text-[11px] text-forest-800">
              accept=&quot;image/*&quot;
            </code>
          </div>

          <input
            ref={fileInputRef}
            id="ocr-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-soga-600/50 bg-canvas-50 px-4 py-8 text-center transition-colors hover:border-soga-900 hover:bg-canvas-100/80"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soga-900/10 text-soga-900">
              <Camera className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-forest-900">
              Ketuk untuk Ambil Foto Nota
            </p>
            <p className="mt-1 max-w-xs text-xs text-forest-800/75">
              atau pilih file gambar bukti pembayaran (JPG/PNG, maks 5 MB)
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sage-400 bg-white px-3 py-1 text-[11px] font-semibold text-sage-600">
              FastAPI OCR Engine Ready
            </span>
          </div>

          {previewImageUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-soga-400/50 bg-canvas-100 p-2">
              <p className="mb-1.5 text-xs font-semibold text-forest-900">Pratinjau Citra Nota</p>
              <img
                src={previewImageUrl}
                alt="Pratinjau nota belanja bahan batik"
                className="max-h-44 w-full rounded-lg object-contain"
              />
            </div>
          ) : null}

          {/* Panduan Singkat Memotret Nota (PRD Bagian 3.3 & F.2-R1) */}
          <div className="mt-4 rounded-xl border border-soga-400/50 bg-canvas-100/70 p-4 text-xs leading-relaxed text-forest-800">
            <p className="flex items-center gap-1.5 font-semibold text-soga-900">
              <Info className="h-4 w-4 shrink-0" />
              <span>Panduan Foto Nota Akurat:</span>
            </p>
            <p className="mt-1">
              Pastikan nota diletakkan di permukaan datar, cahaya terang (tidak berbayang), dan teks angka total terlihat jelas tanpa lipatan.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-canvas-200 pt-3 text-xs">
            <span className="text-forest-800/75">Gagal OCR atau nota tulisan tangan?</span>
            <button
              type="button"
              onClick={switchToManualMode}
              className="font-semibold text-soga-900 hover:underline"
            >
              Input Manual →
            </button>
          </div>
        </div>

        {/* Panel Kanan: Form Pratinjau & Koreksi Hasil OCR / Input Manual */}
        <form
          onSubmit={handleSaveExpense}
          className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                {mode === 'manual' ? 'Form Pengeluaran Manual' : 'Hasil Ekstraksi OCR Nota'}
              </p>
              <p className="text-[11px] text-forest-800/75">
                Sumber: {mode === 'manual' ? 'INPUT_MANUAL' : 'OCR_CAMERA'}
              </p>
            </div>

            {mode === 'ocr' ? (
              draft.needs_verification ? (
                <Badge variant="warning">
                  <FileWarning className="h-3.5 w-3.5" />
                  <span>
                    Perlu Verifikasi (Skor {Number(draft.confidence || 0).toFixed(2)})
                  </span>
                </Badge>
              ) : (
                <Badge variant="sage">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Akurat (Skor {Number(draft.confidence || 0).toFixed(2)})
                  </span>
                </Badge>
              )
            ) : (
              <Badge variant="neutral">Mode Input Manual</Badge>
            )}
          </div>

          {isScanning ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-soga-900">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Membaca teks nota dengan OCR (estimasi 2–10 detik)...</span>
              </div>
              <SkeletonBox className="h-12 w-full" />
              <SkeletonBox className="h-32 w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {mode === 'ocr' && draft.needs_verification ? (
                <div className="rounded-xl border border-amber-400 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-950">
                  <strong>Peringatan PRD (OCR_LOW_CONFIDENCE):</strong> Sebagian teks pada baris harga lilin malam terlipat. Mohon verifikasi dan sesuaikan angka sebelum konfirmasi simpan.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    id="exp-toko"
                    label="Nama Toko / Suplier"
                    value={draft.toko}
                    onChange={(e) => setDraft((prev) => ({ ...prev, toko: e.target.value }))}
                    placeholder="Contoh: Toko Bahan Batik Sumber Malam"
                  />
                </div>
                <Input
                  id="exp-tanggal"
                  type="date"
                  label="Tanggal Transaksi"
                  value={draft.tanggal}
                  onChange={(e) => setDraft((prev) => ({ ...prev, tanggal: e.target.value }))}
                />
              </div>

              <Select
                id="exp-kategori"
                label="Kategori Pengeluaran"
                value={draft.kategori}
                onChange={(e) => setDraft((prev) => ({ ...prev, kategori: e.target.value }))}
              >
                <option value="bahan">Bahan Baku (Kain Mori, Malam, Pewarna)</option>
                <option value="alat">Alat Produksi (Canting, Wajan, Kompor)</option>
                <option value="operasional">Operasional (Gas, Listrik, Kemasan)</option>
              </Select>

              {/* Tabel Rincian Item Nota & Fuzzy Matching Bahan HPP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-forest-900">
                    Bahan Baku (Fuzzy Matched ke Master Bahan HPP)
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          {
                            nama_item: 'Pewarna Alami Soga',
                            material_id: 'MAT-03',
                            qty: 1,
                            satuan: 'gram',
                            harga_per_satuan: 125,
                            needs_correction: false,
                          },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-soga-900 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {draft.items.map((item, idx) => {
                    const subtotal =
                      (Number(item.qty) || 0) * (Number(item.harga_per_satuan) || 0);
                    return (
                      <div
                        key={idx}
                        className={`grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-12 sm:items-center ${item.needs_correction && draft.needs_verification
                            ? 'border-amber-400 bg-amber-50/60'
                            : 'border-soga-400/50 bg-canvas-50/70'
                          }`}
                      >
                        <div className="sm:col-span-5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-forest-900">
                              {item.nama_item}
                            </span>
                            {item.needs_correction && draft.needs_verification ? (
                              <Badge variant="warning">Koreksi</Badge>
                            ) : null}
                          </div>
                          <select
                            aria-label={`Cocokkan master bahan baris ${idx + 1}`}
                            value={item.material_id}
                            onChange={(e) =>
                              updateItemField(idx, 'material_id', e.target.value)
                            }
                            className="mt-1 w-full rounded border border-soga-400/60 bg-white px-2 py-1 text-xs text-forest-800"
                          >
                            <option value="">Non-Master Bahan HPP</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                Master ID: {m.id} • {m.nama}
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
                            onChange={(e) => updateItemField(idx, 'qty', e.target.value)}
                            className="min-h-10 w-full rounded-lg border border-soga-400/70 bg-white px-2.5 text-sm font-semibold text-forest-900"
                          />
                          <NumberInput
                            min="0"
                            step="500"
                            aria-label={`Harga satuan baris ${idx + 1}`}
                            value={item.harga_per_satuan}
                            onChange={(e) =>
                              updateItemField(idx, 'harga_per_satuan', e.target.value)
                            }
                            className="min-h-10 w-full rounded-lg border border-soga-400/70 bg-white px-2.5 text-sm font-semibold text-forest-900"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:col-span-3 sm:justify-end sm:gap-2">
                          <span className="text-sm font-bold text-forest-900">
                            {formatRupiah(subtotal)}
                          </span>
                          {draft.items.length > 1 ? (
                            <button
                              type="button"
                              aria-label="Hapus baris item"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== idx),
                                }))
                              }
                              className="rounded p-1.5 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total & Checkbox Verifikasi */}
              <div className="flex items-center justify-between border-t border-canvas-200 pt-3">
                <span className="text-sm font-semibold text-forest-900">
                  Total Pengeluaran Nota:
                </span>
                <span className="font-display text-xl font-bold text-soga-900">
                  {formatRupiah(totalDraft)}
                </span>
              </div>

              {mode === 'ocr' && draft.needs_verification ? (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-950">
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
                Menyimpan nota bahan baku memperbarui riwayat harga rata-rata bergerak terbobot untuk Kalkulator HPP.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(INITIAL_OCR_DRAFT)}
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
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verifikasi &amp; Perbarui</span>
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Daftar Riwayat Pengeluaran & Master Harga Bahan */}
      {!embedded ? (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Riwayat Pengeluaran &amp; Bukti Nota
            </h2>
            {isLoadingList ? (
              <TableSkeleton rows={3} />
            ) : sortedExpenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-soga-600/50 bg-white p-8 text-center">
                <p className="text-sm font-medium text-forest-800">
                  Belum ada riwayat pengeluaran tercatat.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Navigasi Scrollspy aktif otomatis ketika daftar melebihi 10 baris */}
                {isScrollspyActive ? (
                  <div className="overflow-hidden rounded-xl border border-soga-600/35 bg-canvas-100/90 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-xs text-forest-900">
                        <ListFilter className="h-3.5 w-3.5 shrink-0 text-soga-900" aria-hidden="true" />
                        <span>
                          <strong>Baris {activeSpyIndex + 1}</strong> dari {sortedExpenses.length}{' '}
                          <span className="text-forest-800/75">
                            ({sortedExpenses[activeSpyIndex]?.id || '-'})
                          </span>
                        </span>
                      </div>

                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="navigation"
                        aria-label="Navigasi Scrollspy kategori pengeluaran"
                      >
                        {scrollspyGroups.map((group) => {
                          const isActiveGroup = activeSpyGroupKey === group.key;
                          const isDisabled = group.count === 0;
                          return (
                            <button
                              key={group.key}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => scrollToExpenseRow(group.startIdx)}
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

                <div
                  ref={expenseScrollRef}
                  onScroll={handleExpenseScroll}
                  onWheel={clearProgrammaticSpy}
                  onTouchMove={clearProgrammaticSpy}
                  onPointerDown={clearProgrammaticSpy}
                  className={`space-y-3 ${
                    isScrollspyActive
                      ? 'max-h-[480px] overflow-y-auto scroll-smooth pr-1'
                      : ''
                  }`}
                >
                  {sortedExpenses.map((exp, idx) => {
                    const isSpyRow = isScrollspyActive && idx === activeSpyIndex;
                    const categoryMeta = getExpenseCategoryMeta(exp.kategori);
                    return (
                      <div
                        key={exp.id}
                        ref={(el) => {
                          expenseItemRefs.current[idx] = el;
                        }}
                        className={`flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-soft transition-colors sm:flex-row sm:items-center ${
                          isSpyRow
                            ? 'border-soga-600/50 border-l-4 border-l-soga-700 bg-canvas-50/70'
                            : 'border-soga-600/35'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-forest-900">{exp.toko}</span>
                            <Badge variant={categoryMeta.badgeVariant}>{categoryMeta.label}</Badge>
                            <Badge variant={exp.sumber === 'ocr' ? 'sage' : 'neutral'}>
                              {exp.sumber === 'ocr' ? 'OCR Nota' : 'Manual'}
                            </Badge>
                          </div>
                          <p className="text-xs text-forest-800/75">
                            {exp.id} • {formatTanggalShort(exp.tanggal)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-base font-bold text-forest-900">
                            {formatRupiah(exp.total)}
                          </span>
                          {exp.bukti_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProofUrl(exp.bukti_url)}
                            >
                              <Eye className="h-4 w-4" />
                              <span>Bukti</span>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-4">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Harga Bahan Terkini
            </h2>
            <div className="divide-y divide-canvas-200 rounded-2xl border border-soga-600/35 bg-white p-4 shadow-soft">
              {materials.map((mat) => (
                <div key={mat.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-forest-900">{mat.nama}</p>
                    <Badge
                      variant={mat.stok_saat_ini < mat.stok_minimum ? 'warning' : 'sage'}
                    >
                      {mat.stok_saat_ini} {mat.satuan}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-forest-800/80">
                    Rata-rata bergerak: <strong>{formatRupiah(mat.harga_per_satuan)}</strong> /{' '}
                    {mat.satuan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Modal>
    </section>
  );
}
