import apiClient from '../apiClient';
import { dummyHppRecipes } from '../mockData';
import { calculateHppBreakdown } from '../../utils/hppFormula';

const STORAGE_KEY_RECIPES = 'azrya_demo_recipes';

function getLocalRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECIPES);
    if (raw) return JSON.parse(raw);
  } catch {
    // Abaikan error parse
  }
  return dummyHppRecipes;
}

export async function getHppRecipes() {
  try {
    const response = await apiClient.get('/hpp/recipes');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      return { status: 'success', data: getLocalRecipes() };
    }
    throw error;
  }
}

export async function calculateHpp(payload) {
  try {
    const response = await apiClient.post('/hpp/calculate', payload);
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const result = calculateHppBreakdown({
        bahan: payload.bahan,
        tenagaKerja: payload.tenaga_kerja,
        overhead: payload.overhead,
        yieldCount: payload.yield,
        marginTarget: payload.margin_target,
        hargaKustom: payload.harga_kustom,
      });
      return { status: 'success', data: result };
    }
    throw error;
  }
}

export async function saveHppRecipe(recipePayload) {
  try {
    if (recipePayload.id) {
      const response = await apiClient.put(`/hpp/recipes/${recipePayload.id}`, recipePayload);
      return response.data;
    }
    const response = await apiClient.post('/hpp/recipes', recipePayload);
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const recipes = getLocalRecipes();
      const idx = recipes.findIndex((r) => r.id === recipePayload.id);
      let updated;
      if (idx >= 0) {
        updated = recipes.map((r, i) => (i === idx ? { ...r, ...recipePayload } : r));
      } else {
        updated = [{ ...recipePayload, id: `RCP-${Date.now()}` }, ...recipes];
      }
      localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(updated));
      return {
        status: 'success',
        message: 'Resep HPP berhasil disimpan dan ditetapkan sebagai acuan produk.',
        data: recipePayload,
      };
    }
    throw error;
  }
}
