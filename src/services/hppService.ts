import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import type { ApiResponse, HppBreakdownResult, HppRecipe } from '../types';
import { calculateHppBreakdown } from '../utils/hppFormula';
import apiClient, { isApiError } from './apiClient';
import { dummyHppRecipes } from './mockData';

export interface CalculateHppPayload {
  product_id?: string;
  bahan: HppRecipe['bahan'];
  tenaga_kerja: HppRecipe['tenaga_kerja'];
  overhead: HppRecipe['overhead'];
  yield: number;
  margin_target: number;
  harga_kustom: number;
}

function getLocalRecipes(): HppRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (raw) return JSON.parse(raw) as HppRecipe[];
  } catch {
    // Abaikan error parse storage
  }
  return dummyHppRecipes;
}

export async function getHppRecipes(
  signal?: AbortSignal
): Promise<ApiResponse<HppRecipe[]>> {
  try {
    const response = await apiClient.get<ApiResponse<HppRecipe[]>>(
      API_ENDPOINTS.HPP_RECIPES,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return { status: 'success', data: getLocalRecipes() };
    }
    throw error;
  }
}

export async function calculateHpp(
  payload: CalculateHppPayload,
  signal?: AbortSignal
): Promise<ApiResponse<HppBreakdownResult>> {
  try {
    const response = await apiClient.post<ApiResponse<HppBreakdownResult>>(
      API_ENDPOINTS.HPP_CALCULATE,
      payload,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
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

export async function saveHppRecipe(
  recipePayload: HppRecipe,
  signal?: AbortSignal
): Promise<ApiResponse<HppRecipe>> {
  try {
    if (recipePayload.id) {
      const response = await apiClient.put<ApiResponse<HppRecipe>>(
        `${API_ENDPOINTS.HPP_RECIPES}/${recipePayload.id}`,
        recipePayload,
        { signal }
      );
      return response.data;
    }
    const response = await apiClient.post<ApiResponse<HppRecipe>>(
      API_ENDPOINTS.HPP_RECIPES,
      recipePayload,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      const recipes = getLocalRecipes();
      const idx = recipes.findIndex((r) => r.id === recipePayload.id);
      const updated =
        idx >= 0
          ? recipes.map((r, i) => (i === idx ? { ...r, ...recipePayload } : r))
          : [{ ...recipePayload, id: `RCP-${Date.now()}` }, ...recipes];
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated));
      return {
        status: 'success',
        message: 'Resep HPP berhasil disimpan dan ditetapkan sebagai acuan produk.',
        data: recipePayload,
      };
    }
    throw error;
  }
}
