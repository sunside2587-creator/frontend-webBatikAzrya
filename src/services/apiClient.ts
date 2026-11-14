import axios, { type AxiosError } from 'axios';
import { BUSINESS_CONSTANTS, STORAGE_KEYS } from '../constants';
import type { ApiError } from '../types';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    'Data yang dimasukkan belum sesuai format. Periksa kembali kolom bertanda merah.',
  UNAUTHORIZED:
    'Email atau kata sandi salah, atau sesi Anda telah berakhir. Silakan masuk kembali.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan di sistem.',
  AI_TIMEOUT:
    'Layanan cerdas AI atau OCR sedang memakan waktu lebih lama. Silakan coba lagi atau gunakan input manual.',
  AI_QUOTA_EXCEEDED:
    'Kuota layanan Gemini AI sedang penuh. Sistem menampilkan ringkasan cadangan berbasis aturan.',
  OCR_LOW_CONFIDENCE:
    'Sebagian teks pada nota kurang terbaca jelas. Periksa dan koreksi kolom secara manual sebelum menyimpan.',
};

type UnauthorizedHandler = (message: string) => void;

let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedCallback = typeof handler === 'function' ? handler : null;
}

const configuredBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '';

const apiClient = axios.create({
  baseURL: configuredBaseUrl || 'http://localhost:3000/api/v1',
  timeout: BUSINESS_CONSTANTS.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  // Lewati request jaringan jika VITE_API_BASE_URL belum dikonfigurasi agar bebas error koneksi lokal
  adapter: configuredBaseUrl
    ? undefined
    : (config) => {
        if (config.signal?.aborted) {
          const cancelErr = new axios.CanceledError('Permintaan dibatalkan oleh komponen.');
          return Promise.reject(cancelErr);
        }
        const offlineErr = new Error(
          'Mode simulasi lokal aktif (backend belum dikonfigurasi).'
        ) as AxiosError;
        offlineErr.config = config;
        offlineErr.isAxiosError = true;
        return Promise.reject(offlineErr);
      },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface ErrorPayload {
  code?: string;
  message?: string;
  data?: unknown;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      const canceledError = new Error('Permintaan dibatalkan.') as ApiError;
      canceledError.code = 'ERR_CANCELED';
      canceledError.status = 0;
      canceledError.isNetworkError = false;
      canceledError.isCanceled = true;
      return Promise.reject(canceledError);
    }

    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const code = payload?.code || (status === 401 ? 'UNAUTHORIZED' : null);
    const isNetworkError = !error.response;

    if (status === 401 || code === 'UNAUTHORIZED') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback(
          payload?.message || 'Sesi Anda telah berakhir. Silakan masuk kembali.'
        );
      }
    }

    const mappedMessage =
      payload?.message ||
      (code && ERROR_CODE_MESSAGES[code]) ||
      (isNetworkError
        ? 'Tidak dapat terhubung ke server API. Menggunakan mode data lokal.'
        : error.message || 'Terjadi kesalahan pada sistem.');

    const normalizedError = new Error(mappedMessage) as ApiError;
    normalizedError.code = code || (isNetworkError ? 'NETWORK_OFFLINE' : 'UNKNOWN_ERROR');
    normalizedError.status = status;
    normalizedError.isNetworkError = isNetworkError;
    normalizedError.isCanceled = false;
    normalizedError.details = payload?.data ?? null;

    return Promise.reject(normalizedError);
  }
);

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'isNetworkError' in error;
}

export function isRequestCanceled(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof Error &&
      ('isCanceled' in error
        ? Boolean((error as ApiError).isCanceled)
        : (error as ApiError).code === 'ERR_CANCELED'))
  );
}

export function getErrorMessageByCode(code: string, fallbackMessage?: string): string {
  return ERROR_CODE_MESSAGES[code] || fallbackMessage || 'Terjadi kesalahan pada sistem.';
}

export default apiClient;
