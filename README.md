# Azrya Batik — Sistem Manajemen Keuangan, HPP Dinamis & AI Advisor (Frontend)

> **Digitalisasi Manajemen Keuangan dan Sistem Cerdas Analisis HPP serta Rekomendasi Stok pada UMKM Kerajinan Azrya Batik**  
> **ID Tim Capstone:** `A26-CS087`

Aplikasi web *Single Page Application* (SPA) responsif (*mobile-first*) untuk membantu UMKM **Azrya Batik** (Probolinggo) mendigitalisasi pencatatan kasir (POS), mendokumentasikan nota belanja bahan baku menggunakan pemindaian OCR, menghitung Harga Pokok Penjualan (HPP) batik tulis secara dinamis, serta menyajikan rekap laba rugi instan, peramalan (*forecasting*) kebutuhan stok, dan ringkasan finansial cerdas berbasis AI berbahasa Indonesia.

---

## Fitur Utama (5 Modul Layar MVP)

1. **Autentikasi & *Role-Based Access Control* (`/login`)**
   - Login berbasis JWT dengan *route guard* (`ProtectedRoute`) berdasarkan peran pengguna:
     - **Pemilik UMKM (`owner`)**: Akses penuh ke seluruh modul (POS, Pengeluaran & OCR, Kalkulator HPP, dan Dashboard AI).
     - **Admin / Kasir (`cashier`)**: Akses khusus operasional pencatatan harian (POS Penjualan dan Pengeluaran/OCR Nota).

2. **Kasir Cepat / Point of Sales (`/pos`)**
   - Pencatatan transaksi penjualan produk batik (Kain Batik Tulis, Seragam B2G/ASN, Selendang, Tas Etnik Kulit).
   - Mendukung harga katalog maupun harga kustom/negosiasi beserta kalkulasi estimasi margin secara *real-time* dan peringatan otomatis jika harga berada di bawah HPP.
   - Klasifikasi segmen pelanggan (`B2G`, `B2B`, `B2C`), metode pembayaran (`tunai`, `transfer`), dan status pembayaran (`lunas`, `DP`, `belum_bayar`) dengan navigasi *scrollspy*.

3. **Dokumentasi Pengeluaran & Pemindai Nota OCR (`/expenses`)**
   - Unggah foto nota belanja bahan baku dari kamera ponsel atau galeri (`JPG`/`PNG`, maks. 5 MB) untuk diekstraksi otomatis melalui endpoint OCR.
   - Indikator skor kepercayaan (*confidence score*) hasil OCR, penandaan item yang memerlukan verifikasi manual, dan *fuzzy matching* ke master bahan baku (`Kain Mori`, `Lilin Malam`, `Pewarna Alami Soga`).
   - Mode fallback **Input Manual** untuk nota tulisan tangan serta modal pratinjau bukti foto nota.

4. **Kalkulator HPP Batik Dinamis & Resep Biaya (`/hpp`)**
   - Perhitungan HPP per lembar/unit berdasarkan rincian Biaya Bahan Baku (BB) dengan penyesuaian tingkat susut (*shrinkage rate*), Biaya Tenaga Kerja Langsung (TKL), Biaya Overhead Pabrik (BOP), *production yield*, dan target margin.
   - Peringatan otomatis apabila simulasi harga jual kustom berada di bawah HPP pokok dan fitur penyimpanan resep biaya ke katalog.

5. **Dashboard Finansial, Forecasting Stok & AI Advisor (`/dashboard`)**
   - Kartu KPI utama (Total Omzet, Total Pengeluaran, Estimasi Laba Bersih, Margin Bersih, Jumlah Transaksi) dengan filter periode, kategori produk, dan segmen pasar.
   - Visualisasi tren pemasukan vs pengeluaran bulanan dan peringkat produk terlaris.
   - Peramalan (*forecasting*) permintaan dan rekomendasi *restock* bahan baku kritis (Kain Mori & Lilin Malam).
   - Kartu ringkasan kesehatan bisnis mingguan berbasis **Gemini AI** serta asisten tanya-jawab interaktif (**RAG Chat Assistant**) berbahasa Indonesia.

---

## Tech Stack & Arsitektur

- **Framework:** React 18 (Functional Components + Custom Hooks)
- **Bahasa:** TypeScript (`strict` mode)
- **Build Tool:** Vite 5
- **Routing:** React Router v6 (`BrowserRouter` + fallback dual-mode + `React.lazy` & `Suspense`)
- **Styling:** Tailwind CSS 3 (*mobile-first*, palet warna kustom bertema batik: `forest`, `soga`, `canvas`, `sage`)
- **HTTP Client:** Axios (instance terpusat dengan *request/response interceptor*, *timeout*, `AbortController`, dan *offline/demo fallback* otomatis ke `localStorage`)
- **Ikon:** Lucide React

---

## Struktur Folder (Clean Code & Feature-Based)

```text
src/
├─ components/
│  ├─ layout/         # AppShell, Navbar, Sidebar, Footer
│  └─ ui/             # Komponen UI reusable (Button, Input, Badge, Modal, Skeleton, Toast, ScrollspyBar, BatikOrnaments)
├─ constants/         # Konstanta endpoint API, kunci storage, dan parameter bisnis
├─ features/          # Modul fitur (komponen presentational & custom hooks per domain)
│  ├─ dashboard/      # KpiCardsGrid, WeeklyInsightCard, RagAssistantCard, useDashboardFeature
│  ├─ expenses/       # OcrScannerCard, ExpenseHistorySection, useExpensesFeature
│  ├─ hpp/            # HppSummaryCard, useHppFeature
│  └─ pos/            # PosMarginPanel, PosTransactionHistory, usePosFeature
├─ hooks/             # Global hooks & context (useAuth, useToast, useScrollspyGroups)
├─ pages/             # Halaman rute utama (LoginPage, PosPage, ExpensesOcrPage, HppCalculatorPage, DashboardAiPage)
├─ routes/            # Konfigurasi rute terpusat (routeConfig, AppRouter, ProtectedRoute)
├─ services/          # Axios instance (apiClient) & service layer per domain + mockData fallback
├─ types/             # Definisi tipe & interface TypeScript terpusat
└─ utils/             # Fungsi utilitas murni (cn, formatters mata uang/tanggal, hppFormula)
```

---

## Cara Menjalankan Proyek di Lokal

### 1. Prasyarat
- **Node.js** versi `18.x` atau lebih baru
- **npm** versi `9.x` atau lebih baru

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable (Opsional)
Secara bawaan, aplikasi mengarah ke `/api/v1` dan memiliki mode **Demo / Offline Fallback** otomatis jika server backend belum aktif. Untuk menghubungkan ke server backend Express atau dashboard Streamlit eksternal, buat file `.env` di root proyek:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STREAMLIT_URL=https://azrya-batik-analytics.streamlit.app
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

### 5. Pemeriksaan Tipe TypeScript & Build Produksi
```bash
# Mengecek validitas tipe TypeScript tanpa menghasilkan file output
npm run typecheck

# Membuat bundle produksi ke dalam folder dist/
npm run build

# Menjalankan pratinjau hasil build produksi
npm run preview
```

---

## Akun Demo (Mode Simulasi / Offline Fallback)

Saat dijalankan tanpa backend aktif, Anda dapat langsung menguji seluruh fitur menggunakan akun simulasi berikut di halaman `/login`:

| Peran | Email | Kata Sandi | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Pemilik UMKM (Owner)** | `owner@azryabatik.id` | `azrya2026` | Seluruh halaman (`POS`, `Pengeluaran & OCR`, `Kalkulator HPP`, `Dashboard AI`) |
| **Admin / Kasir** | `kasir@azryabatik.id` | `azrya2026` | Halaman operasional (`POS` dan `Pengeluaran & OCR`) |

---

## Deployment

Proyek ini telah dilengkapi konfigurasi *SPA routing rewrite* agar navigasi halaman tetap berfungsi saat di-*refresh* pada berbagai platform hosting:
- **Vercel:** Terkonfigurasi melalui `vercel.json`
- **Netlify / Cloudflare Pages / Render:** Terkonfigurasi melalui `public/_redirects`
- **VS Code Live Server:** Mendukung pembukaan langsung `index.html` setelah menjalankan `npm run build`
