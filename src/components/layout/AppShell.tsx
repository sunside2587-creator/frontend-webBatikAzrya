import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  PAGE_TITLES,
  ROUTE_ALLOWED_ROLES,
  ROUTES,
  VALID_ROUTES,
  type RouteId,
} from '../../routes/routeConfig';
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

const LOGOUT_MESSAGE = 'Anda sudah keluar dari Azrya Batik.';

export function AppShell() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { user, role, isAuthenticated, logout, switchDemoRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    setIsBottomBarVisible(true);
    lastScrollYRef.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const lastY = lastScrollYRef.current;

      if (currentY <= 40 || currentY < lastY - 8) {
        setIsBottomBarVisible(true);
        lastScrollYRef.current = currentY;
      } else if (currentY > 40 && currentY > lastY + 8) {
        setIsBottomBarVisible(false);
        lastScrollYRef.current = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const segment = location.pathname.replace(/^\/+/, '').split('/')[0] as RouteId;
  const activeRoute: RouteId = VALID_ROUTES.includes(segment) ? segment : ROUTES.POS;

  const visibleMobileItems = isAuthenticated
    ? MOBILE_BAR_ITEMS.filter((item) => ROUTE_ALLOWED_ROLES[item.id].includes(role))
    : [];

  const handleNavigate = useCallback(
    (route: RouteId) => {
      routerNavigate(`/${route}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [routerNavigate]
  );

  const handleCloseMobile = useCallback(() => setIsMobileOpen(false), []);
  const handleOpenMobile = useCallback(() => setIsMobileOpen(true), []);
  const handleLogout = useCallback(() => logout(LOGOUT_MESSAGE), [logout]);

  return (
    <div className="flex min-h-screen bg-canvas-50 text-forest-900">
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          activeTitle={PAGE_TITLES[activeRoute] || 'Azrya Batik'}
          onOpenMobileSidebar={handleOpenMobile}
          user={user}
          onSwitchRole={switchDemoRole}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <main className={cn('flex-1', visibleMobileItems.length > 0 ? 'pb-20 lg:pb-8' : 'pb-8')}>
          <Outlet />
        </main>

        <Footer className={visibleMobileItems.length > 0 ? 'mb-16 lg:mb-0' : ''} />

        {visibleMobileItems.length > 0 ? (
          <nav
            aria-label="Navigasi cepat seluler"
            className={cn(
              'fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-soga-600/30 bg-canvas-50/95 px-2 py-1.5 backdrop-blur transition-transform duration-300 ease-out lg:hidden',
              isBottomBarVisible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
            )}
          >
            {visibleMobileItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 min-w-16 flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold transition-colors',
                    isActive
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
        ) : null}
      </div>

      <Modal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Panduan Pengguna"
      >
        <div className="space-y-5 text-sm leading-relaxed text-forest-800">
          <div className="rounded-xl border border-soga-600/30 bg-canvas-100 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-soga-900">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Cara memotret nota
            </h4>
            <ul className="mt-2 space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <Sun className="mt-0.5 h-4 w-4 shrink-0 text-soga-700" aria-hidden="true" />
                <span>
                  Letakkan nota di permukaan datar dengan cahaya terang tanpa bayangan tangan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
                <span>
                  Pastikan tepi kertas lurus dan kolom harga tidak terlipat.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
                <span>
                  Jika muncul tanda kuning <strong>Perlu dicek</strong>, periksa ulang angkanya sebelum menyimpan.
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-forest-900">Siapa memakai menu apa</h4>
            <p>
              <strong>Kasir:</strong> menu <em>Kasir</em> untuk mencatat penjualan B2G/B2B/B2C, dan menu <em>Nota Belanja</em> untuk memotret nota mori atau malam.
            </p>
            <p>
              <strong>Pemilik:</strong> menu <em>Kalkulator HPP</em> untuk mengecek harga terendah saat negosiasi, dan menu <em>Laporan</em> untuk laba rugi dan stok.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setIsGuideOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
