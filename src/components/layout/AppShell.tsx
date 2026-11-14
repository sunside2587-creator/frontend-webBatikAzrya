import { useCallback, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Camera,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PAGE_TITLES, ROUTES, VALID_ROUTES, type RouteId } from '../../routes/routeConfig';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const MOBILE_BAR_ITEMS: ReadonlyArray<{
  id: RouteId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: ROUTES.POS, label: 'Kasir', icon: CreditCard },
  { id: ROUTES.EXPENSES, label: 'Nota', icon: Receipt },
  { id: ROUTES.HPP, label: 'HPP', icon: Calculator },
  { id: ROUTES.DASHBOARD, label: 'Laporan', icon: LayoutDashboard },
];

export function AppShell() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const segment = location.pathname.replace(/^\/+/, '').split('/')[0] as RouteId;
  const activeRoute: RouteId = VALID_ROUTES.includes(segment) ? segment : ROUTES.POS;

  const handleNavigate = useCallback(
    (route: RouteId) => {
      routerNavigate(`/${route}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [routerNavigate]
  );

  return (
    <div className="flex min-h-screen bg-canvas-50 text-forest-900">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
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
          onNavigate={handleNavigate}
        />

        <main className="flex-1 pb-20 lg:pb-8">
          <Outlet />
        </main>

        <Footer onNavigate={handleNavigate} />

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
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'flex min-h-11 min-w-16 flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold transition-colors',
                  active
                    ? 'bg-forest-900 text-canvas-50'
                    : 'text-forest-800 hover:bg-canvas-100'
                )}
              >
                <Icon className="mb-0.5 h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

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
                <span>
                  Letakkan nota di permukaan datar dengan cahaya terang tanpa bayangan tangan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                <span>
                  Pastikan bagian tepi kertas lurus dan tidak terlipat pada kolom angka harga.
                </span>
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
            <h4 className="font-semibold text-forest-900">
              Alur Singkat Kasir &amp; Pemilik
            </h4>
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
