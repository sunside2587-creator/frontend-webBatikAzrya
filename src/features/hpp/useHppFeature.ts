import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUSINESS_CONSTANTS } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { isRequestCanceled } from '../../services/apiClient';
import { calculateHpp, getHppRecipes, saveHppRecipe } from '../../services/hppService';
import { dummyHppRecipes } from '../../services/mockData';
import type {
  HppLaborCost,
  HppMaterialItem,
  HppOverheadCost,
  HppRecipe,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { calculateHppBreakdown } from '../../utils/hppFormula';

export function useHppFeature() {
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<HppRecipe[]>(dummyHppRecipes);
  const [selectedRecipeId, setSelectedRecipeId] = useState('RCP-01');

  const [bahan, setBahan] = useState<HppMaterialItem[]>(dummyHppRecipes[0].bahan);
  const [tenagaKerja, setTenagaKerja] = useState<HppLaborCost>(
    dummyHppRecipes[0].tenaga_kerja
  );
  const [overhead, setOverhead] = useState<HppOverheadCost>(
    dummyHppRecipes[0].overhead
  );
  const [yieldCount, setYieldCount] = useState<number>(dummyHppRecipes[0].yield);
  const [marginTargetPct, setMarginTargetPct] = useState<number>(
    BUSINESS_CONSTANTS.DEFAULT_MARGIN_TARGET_PCT
  );
  const [hargaKustom, setHargaKustom] = useState<number | string>(
    dummyHppRecipes[0].harga_kustom
  );

  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getHppRecipes(controller.signal)
      .then((res) => {
        if (controller.signal.aborted || !Array.isArray(res.data) || res.data.length === 0) {
          return;
        }
        setRecipes(res.data);
        const initial = res.data.find((r) => r.id === 'RCP-01') || res.data[0];
        setSelectedRecipeId(initial.id);
        setBahan(initial.bahan);
        setTenagaKerja(initial.tenaga_kerja);
        setOverhead(initial.overhead);
        setYieldCount(initial.yield || 1);
        setMarginTargetPct(Math.round((initial.margin_target || 0.35) * 100));
        setHargaKustom(initial.harga_kustom || 0);
      })
      .catch((error) => {
        if (isRequestCanceled(error)) return;
        // Tetap gunakan fallback resep awal lokal
      });
    return () => {
      controller.abort();
    };
  }, []);

  const handleLoadRecipe = useCallback(
    (recipeId: string) => {
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
    },
    [recipes, showToast]
  );

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

  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
  }, [recipes, selectedRecipeId]);

  const handleMaterialChange = useCallback(
    (index: number, field: keyof HppMaterialItem, value: number | string) => {
      setBahan((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                [field]: field === 'nama' ? String(value) : Number(value) || 0,
              }
            : item
        )
      );
    },
    []
  );

  const handleAddMaterial = useCallback(() => {
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
    ]);
  }, []);

  const handleRemoveMaterial = useCallback((index: number) => {
    setBahan((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLaborChange = useCallback(
    (field: keyof HppLaborCost, value: number | string) => {
      setTenagaKerja((prev) => ({
        ...prev,
        [field]: Number(value) || 0,
      }));
    },
    []
  );

  const handleOverheadChange = useCallback(
    (field: keyof HppOverheadCost, value: number | string) => {
      setOverhead((prev) => ({
        ...prev,
        [field]:
          field === 'up' ? Math.max(1, Number(value) || 1) : Number(value) || 0,
      }));
    },
    []
  );

  const handleYieldChange = useCallback((value: number | string) => {
    setYieldCount(Math.max(1, Number(value) || 1));
  }, []);

  const handleMarginChange = useCallback((value: number | string) => {
    setMarginTargetPct(Math.min(90, Math.max(1, Number(value) || 0)));
  }, []);

  const handleRecalculateApi = useCallback(async () => {
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
      showToast(
        err instanceof Error ? err.message : 'Gagal menghitung ulang HPP.',
        'error'
      );
    } finally {
      setIsCalculating(false);
    }
  }, [
    activeRecipe?.product_id,
    bahan,
    hargaKustom,
    marginTargetPct,
    overhead,
    result.hpp_unit,
    showToast,
    tenagaKerja,
    yieldCount,
  ]);

  const handleSaveRecipe = useCallback(async () => {
    if (!activeRecipe) return;
    setIsSaving(true);
    try {
      const payload: HppRecipe = {
        ...activeRecipe,
        bahan,
        tenaga_kerja: tenagaKerja,
        overhead,
        yield: Number(yieldCount) || 1,
        margin_target: marginTargetPct / 100,
        harga_kustom: Number(hargaKustom) || 0,
      };
      const res = await saveHppRecipe(payload);
      setRecipes((prev) => prev.map((r) => (r.id === payload.id ? payload : r)));
      showToast(res.message || 'Resep HPP produk berhasil disimpan.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menyimpan resep HPP.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    activeRecipe,
    bahan,
    hargaKustom,
    marginTargetPct,
    overhead,
    showToast,
    tenagaKerja,
    yieldCount,
  ]);

  return {
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
  };
}
