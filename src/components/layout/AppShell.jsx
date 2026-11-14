import { useState } from 'react';
import {
  Calculator,
  Camera,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Lock,
  Receipt,
  Sun,
} from 'lucide-react';
import { Sidebar, NAV_ITEMS } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES = {
  login: 'Masuk ke Sistem Azrya Batik',
  pos: 'Kasir Cepat (POS) & Penentuan Margin',
  expenses: 'Dokumentasi Nota Digital & OCR Bahan',
  hpp: 'Kalkulator HPP Batik Dinamis',
  dashboard: 'Dashboard Finansial, Stok & AI Advisor',
};

const MOBILE_BAR_ITEMS = [
  { id: 'pos', label: 'Kasir', icon: CreditCard },
  { id: 'expenses', label: 'Nota', icon: Receipt },
  { id: 'hpp', label: 'HPP', icon: Calculator },
  { id: 'dashboard', label: 'Laporan', icon: LayoutDashboard },
];

export function AppShell({ activeRoute, onNavigate, children }) {
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((item) => item.id === activeRoute);
  const role = user?.role || 'guest';
  const isRouteRestricted = activeNav && !activeNav.roles.includes(role);

  return (
    <div className="flex min-h-screen bg-canvas-50 text-forest-900">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={() => logout('Anda telah keluar dari sesi Azrya Batik.')}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          activeTitle={PAGE_TITLES[activeRoute] || 'Azrya Batik'}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          user={user}
          onSwitchRole={switchDemoRole}
          onNavigate={onNavigate}
        />

        <main className="flex-1 pb-20 lg:pb-8">
          {isRouteRestricted ? (
            <div className="mx-auto max-w-2xl px-4 py-16">
              <div className="rounded-2xl border border-soga-600/40 bg-white p-6 text-center shadow-card sm:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soga-900/10 text-soga-900">
                  <Lock className="h-7 w-7" />
                </div>
                <h1 className="font-display text-2xl font-bold text-forest-900">
                  Akses Khusus Pemilik UMKM
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-forest-800/80">
                  Anda sedang masuk sebagai peran{' '}
                  <strong>{role === 'cashier' ? 'Admin / Kasir' : 'Tamu'}</strong>. Halaman{' '}
                  <strong>{PAGE_TITLES[activeRoute]}</strong> hanya dapat dibuka oleh Pemilik Azrya Batik.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" onClick={() => onNavigate('pos')}>
                    Buka Layar POS Kasir
                  </Button>
                  <Button variant="outline" onClick={() => switchDemoRole('owner')}>
                    Ganti ke Akun Pemilik (Demo)
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        <Footer onNavigate={onNavigate} />

        {/* Bottom Navigation Bar khusus Mobile untuk akses satu tangan */}
        <nav
          aria-label="Navigasi cepat seluler"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-soga-600/35 bg-canvas-50/95 px-2 py-1.5 backdrop-blur lg:hidden"
        >
          {MOBILE_BAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-11 min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold transition-colors ${
                  active ? 'bg-forest-900 text-canvas-50' : 'text-forest-800 hover:bg-canvas-100'
                }`}
              >
                <Icon className="mb-0.5 h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modal Panduan Pengguna & Cara Memotret Nota Akurat (PRD Bagian 1.3 & 3.3) */}
      <Modal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Panduan Pengguna & Foto Nota Akurat"
      >
        <div className="space-y-5 text-sm leading-relaxed text-forest-800">
          <div className="rounded-xl border border-soga-600/35 bg-canvas-100 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-soga-900">
              <Camera className="h-4 w-4" />
              Cara Memotret Nota Bahan Baku untuk OCR
            </h4>
            <ul className="mt-2 space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <Sun className="mt-0.5 h-4 w-4 shrink-0 text-soga-700" />
                <span>Letakkan nota di permukaan datar dengan cahaya terang tanpa bayangan tangan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                <span>Pastikan bagian tepi kertas lurus dan tidak terlipat pada kolom angka harga.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                <span>
                  Jika muncul tanda kuning <strong>Perlu Verifikasi</strong>, periksa ulang angka sebelum menekan simpan.
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-forest-900">Alur Singkat Kasir &amp; Pemilik</h4>
            <p>
              1. <strong>Kasir / Admin:</strong> Gunakan menu <em>POS Kasir &amp; Margin</em> untuk mencatat transaksi B2G/B2B/B2C serta menu <em>Pengeluaran &amp; OCR</em> untuk mengunggah nota belanja mori atau malam.
            </p>
            <p>
              2. <strong>Pemilik UMKM:</strong> Gunakan <em>Kalkulator HPP</em> untuk mengecek batas aman harga negosiasi pesanan, lalu pantau <em>Dashboard &amp; AI</em> untuk rekap laba rugi dan stok.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setIsGuideOpen(false)}>
              Tutup Panduan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
