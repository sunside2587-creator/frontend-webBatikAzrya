import axios from 'axios';

const ERROR_CODE_MESSAGES = {
  VALIDATION_ERROR: 'Data yang dimasukkan belum sesuai format. Periksa kembali kolom bertanda merah.',
  UNAUTHORIZED: 'Email atau kata sandi salah, atau sesi Anda telah berakhir. Silakan masuk kembali.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan di sistem.',
  AI_TIMEOUT: 'Layanan cerdas AI atau OCR sedang memakan waktu lebih lama. Silakan coba lagi atau gunakan input manual.',
  AI_QUOTA_EXCEEDED: 'Kuota layanan Gemini AI sedang penuh. Sistem menampilkan ringkasan cadangan berbasis aturan.',
  OCR_LOW_CONFIDENCE: 'Sebagian teks pada nota kurang terbaca jelas. Periksa dan koreksi kolom secara manual sebelum menyimpan.',
};

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorizedCallback = typeof handler === 'function' ? handler : null;
}

const configuredBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '';

const apiClient = axios.create({
  baseURL: configuredBaseUrl || 'http://localhost:3000/api/v1',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Jika VITE_API_BASE_URL belum dikonfigurasi, lewati request jaringan ke localhost:3000
  // agar browser console bebas dari error net::ERR_CONNECTION_REFUSED saat mode demo lokal.
  adapter: configuredBaseUrl
    ? undefined
    : (config) => {
        const offlineErr = new Error('Mode simulasi lokal aktif (backend belum dikonfigurasi).');
        offlineErr.config = config;
        offlineErr.isAxiosError = true;
        return Promise.reject(offlineErr);
      },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    const code = payload?.code || (status === 401 ? 'UNAUTHORIZED' : null);
    const isNetworkError = !error.response;

    if (status === 401 || code === 'UNAUTHORIZED') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('azrya_user');
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

    const normalizedError = new Error(mappedMessage);
    normalizedError.code = code || (isNetworkError ? 'NETWORK_OFFLINE' : 'UNKNOWN_ERROR');
    normalizedError.status = status || 0;
    normalizedError.isNetworkError = isNetworkError;
    normalizedError.details = payload?.data || null;

    return Promise.reject(normalizedError);
  }
);

export function getErrorMessageByCode(code, fallbackMessage) {
  return ERROR_CODE_MESSAGES[code] || fallbackMessage || 'Terjadi kesalahan pada sistem.';
}

export default apiClient;
