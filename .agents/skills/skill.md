---
name: react-axios-tailwind
description: Standar arsitektur dan best practices untuk pengembangan frontend menggunakan React (Vite), Tailwind CSS, dan Axios. Gunakan skill ini setiap kali membuat komponen UI, integrasi API, service layer, atau custom hooks.
---

# Panduan Arsitektur React + Tailwind CSS + Axios

Setiap kali menulis atau memodifikasi kode di proyek ini, ikuti aturan arsitektur berikut secara ketat:

## 1. Struktur Folder Proyek
Pisahkan logika bisnis, pemanggilan API, dan komponen antarmuka (UI):
- `src/api/` atau `src/services/`: Konfigurasi instance Axios dan fungsi pemanggilan endpoint per modul.
- `src/components/ui/`: Komponen UI dasar yang dapat digunakan ulang (Button, Input, Modal, Skeleton, Badge).
- `src/components/layout/`: Komponen tata letak (Navbar, Footer, Sidebar, Container).
- `src/hooks/`: Custom React hooks untuk manajemen state dan fetching data.
- `src/pages/`: Komponen halaman utama yang menggabungkan beberapa komponen kecil.
- `src/utils/`: Fungsi pembantu seperti pemformat mata uang Rupiah, tanggal, atau validasi.

## 2. Standar Penggunaan Axios (API Layer)
Jangan pernah memanggil `axios.get` atau `axios.post` secara langsung di dalam komponen React.
- **Centralized Instance**: Selalu buat satu instance utama menggunakan `axios.create` dengan `baseURL` dari `import.meta.env.VITE_API_BASE_URL` dan konfigurasi `timeout`.
- **Interceptors**:
  - Gunakan *Request Interceptor* untuk menyisipkan token autentikasi (`Authorization: Bearer <token>`) secara otomatis jika tersedia.
  - Gunakan *Response Interceptor* untuk menormalisasi pesan error (menangani status 401, 403, 404, dan 500) agar mudah ditampilkan di UI.
- **Modular Services**: Kelompokkan request berdasarkan fitur (misalnya modul produk, keranjang, atau transaksi) menggunakan fungsi `async/await` yang mengembalikan `response.data`.

### Contoh Pola Instance Axios:
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
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
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan pada jaringan';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;