import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  BUSINESS_CONSTANTS,
  EXPENSE_CATEGORY_GROUPS,
  EXPENSE_CATEGORY_ORDER,
} from '../../constants';
import { useToast } from '../../hooks/useToast';
import { isRequestCanceled } from '../../services/apiClient';
import {
  createExpense,
  getExpenses,
  getMaterials,
  scanReceiptOcr,
  type OcrSimulationMode,
} from '../../services/expenseService';
import type {
  Expense,
  ExpenseCategoryKey,
  ExpenseDraft,
  ExpenseDraftItem,
  ExpenseSource,
  Material,
  ScrollspyGroupConfig,
} from '../../types';

export const INITIAL_OCR_DRAFT: ExpenseDraft = {
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

export function normalizeExpenseCategory(kategori: string): ExpenseCategoryKey {
  const raw = String(kategori || '').trim().toLowerCase();
  if (raw.includes('bahan')) return 'bahan';
  if (raw.includes('alat')) return 'alat';
  return 'operasional';
}

export function getExpenseCategoryMeta(
  kategori: string
): ScrollspyGroupConfig<ExpenseCategoryKey> {
  const key = normalizeExpenseCategory(kategori);
  return (
    EXPENSE_CATEGORY_GROUPS.find((g) => g.key === key) || EXPENSE_CATEGORY_GROUPS[2]
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve(URL.createObjectURL(file));
      }
    };
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

export function useExpensesFeature() {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<ExpenseSource>('ocr');
  const [ocrErrorBanner, setOcrErrorBanner] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [draft, setDraft] = useState<ExpenseDraft>(INITIAL_OCR_DRAFT);
  const [userConfirmedLowConf, setUserConfirmedLowConf] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingList(true);

    Promise.all([getMaterials(controller.signal), getExpenses(controller.signal)])
      .then(([matRes, expRes]) => {
        if (controller.signal.aborted) return;
        setMaterials(matRes.data || []);
        setExpenses(expRes.data || []);
      })
      .catch((err) => {
        if (controller.signal.aborted || isRequestCanceled(err)) return;
        showToast(
          err instanceof Error ? err.message : 'Gagal memuat riwayat pengeluaran.',
          'error'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingList(false);
      });

    return () => {
      controller.abort();
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

  const handleRunOcrScan = useCallback(
    async (
      file: File | null,
      simulationMode: OcrSimulationMode,
      overridePreviewUrl?: string
    ) => {
      const resolvedPreviewUrl = overridePreviewUrl ?? previewImageUrl;
      setIsScanning(true);
      setOcrErrorBanner('');
      setUserConfirmedLowConf(false);
      setMode('ocr');

      try {
        const res = await scanReceiptOcr(file, simulationMode);
        const data = res.data;
        setDraft({
          toko: data.toko || '',
          tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
          kategori: data.kategori || 'bahan',
          sumber: 'ocr',
          confidence: data.confidence ?? 0.9,
          needs_verification: Boolean(
            data.needs_verification || data.code === 'OCR_LOW_CONFIDENCE'
          ),
          bukti_url:
            overridePreviewUrl || data.bukti_url || resolvedPreviewUrl || '/assets/corak_batikHitam.jpg',
          items: (data.items || []).map((it) => ({
            nama_item: it.nama_item,
            material_id: it.material_id || '',
            qty: it.qty,
            satuan: it.satuan,
            harga_per_satuan: it.harga ?? it.harga_per_satuan ?? 0,
            needs_correction: Boolean(it.needs_correction),
          })),
        });

        if (data.needs_verification || res.code === 'OCR_LOW_CONFIDENCE') {
          showToast(
            'Hasil OCR memiliki skor kepercayaan rendah. Mohon periksa kolom bertanda Perlu Verifikasi.',
            'warning'
          );
        } else {
          showToast('Pembacaan nota OCR selesai dengan akurat.', 'success');
        }
      } catch (err) {
        setOcrErrorBanner(
          err instanceof Error && err.message
            ? err.message
            : 'Layanan OCR mengalami timeout (AI_TIMEOUT). Mode Input Manual diaktifkan agar pencatatan tetap berjalan.'
        );
        setMode('manual');
        setDraft({
          toko: '',
          tanggal: new Date().toISOString().slice(0, 10),
          kategori: 'bahan',
          sumber: 'manual',
          confidence: 1,
          needs_verification: false,
          bukti_url: resolvedPreviewUrl || '',
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
    },
    [previewImageUrl, showToast]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const isImageFile =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|bmp|heic|jfif)$/i.test(file.name);
      if (!isImageFile) {
        showToast('File harus berupa gambar nota (JPG atau PNG).', 'error');
        return;
      }
      if (file.size > BUSINESS_CONSTANTS.MAX_OCR_IMAGE_BYTES) {
        showToast(
          'Ukuran gambar maksimal 5 MB agar pembacaan OCR tetap cepat.',
          'error'
        );
        return;
      }

      const imageUrl = await readFileAsDataUrl(file);
      setSelectedFileName(file.name);
      setPreviewImageUrl(imageUrl);
      await handleRunOcrScan(file, 'low_confidence', imageUrl);
    },
    [handleRunOcrScan, showToast]
  );

  const handleSwitchToManualMode = useCallback(() => {
    setMode('manual');
    setOcrErrorBanner('');
    setUserConfirmedLowConf(true);
    setDraft((prev) => ({
      ...prev,
      sumber: 'manual',
      needs_verification: false,
    }));
  }, []);

  const handleUpdateDraftField = useCallback(
    <K extends keyof ExpenseDraft>(field: K, value: ExpenseDraft[K]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUpdateItemField = useCallback(
    (
      index: number,
      field: keyof ExpenseDraftItem,
      value: ExpenseDraftItem[keyof ExpenseDraftItem]
    ) => {
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
    },
    [materials]
  );

  const handleAddDraftItem = useCallback(() => {
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
    }));
  }, []);

  const handleRemoveDraftItem = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const handleResetDraft = useCallback(() => {
    setMode('ocr');
    setOcrErrorBanner('');
    setPreviewImageUrl('');
    setSelectedFileName('');
    setUserConfirmedLowConf(false);
    setDraft(INITIAL_OCR_DRAFT);
  }, []);

  const handleSaveExpense = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
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
          sumber: mode,
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
        showToast(
          err instanceof Error ? err.message : 'Gagal menyimpan data pengeluaran.',
          'error'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [draft, mode, showToast, totalDraft, userConfirmedLowConf]
  );

  return {
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
  };
}
