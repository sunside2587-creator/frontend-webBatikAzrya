import { API_ENDPOINTS, BUSINESS_CONSTANTS, STORAGE_KEYS } from '../constants';
import type { ApiError, ApiResponse, User } from '../types';
import apiClient, { isApiError } from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponseData {
  token: string;
  user: User;
}

const DEMO_USERS: Record<string, User> = {
  'owner@azryabatik.id': {
    id: 'USR-01',
    nama: 'Ibu Azrya (Pemilik UMKM)',
    email: 'owner@azryabatik.id',
    role: 'owner',
  },
  'kasir@azryabatik.id': {
    id: 'USR-02',
    nama: 'Sandi (Admin / Kasir Galeri)',
    email: 'kasir@azryabatik.id',
    role: 'cashier',
  },
};

export async function loginRequest(
  { email, password }: LoginCredentials,
  signal?: AbortSignal
): Promise<ApiResponse<LoginResponseData>> {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>(
      API_ENDPOINTS.AUTH_LOGIN,
      { email, password },
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const matched = DEMO_USERS[normalizedEmail];
      if (!matched || password !== BUSINESS_CONSTANTS.DEMO_PASSWORD) {
        const authErr = new Error(
          'Email atau kata sandi salah, silakan periksa kembali.'
        ) as ApiError;
        authErr.code = 'UNAUTHORIZED';
        authErr.status = 401;
        authErr.isNetworkError = false;
        throw authErr;
      }
      return {
        status: 'success',
        message: 'Berhasil masuk ke sistem Azrya Batik (Mode Demo Lokal).',
        data: {
          token: `demo-jwt-${matched.role}-${Date.now()}`,
          user: matched,
        },
      };
    }
    throw error;
  }
}

export async function fetchCurrentUser(
  signal?: AbortSignal
): Promise<ApiResponse<User>> {
  try {
    const response = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.AUTH_ME, {
      signal,
    });
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        return {
          status: 'success',
          data: JSON.parse(saved) as User,
        };
      }
    }
    throw error;
  }
}
