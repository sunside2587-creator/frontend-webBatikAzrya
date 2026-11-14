import {
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Receipt,
  X,
} from 'lucide-react';
import { BatikDarkBackdrop, BatikSideBorder } from '../ui/BatikOrnaments';

export const NAV_ITEMS = [
  {
    id: 'pos',
    label: 'POS Kasir & Margin',
    sublabel: 'Catat Penjualan',
    icon: CreditCard,
    roles: ['owner', 'cashier'],
  },
  {
    id: 'expenses',
    label: 'Pengeluaran & OCR',
    sublabel: 'Scan Nota Bahan',
    icon: Receipt,
    roles: ['owner', 'cashier'],
  },
  {
    id: 'hpp',
    label: 'Kalkulator HPP',
    sublabel: 'Resep & Anti-Rugi',
    icon: Calculator,
    roles: ['owner'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard & AI',
    sublabel: 'Laba Rugi & Stok',
    icon: LayoutDashboard,
    roles: ['owner'],
  },
];

export function Sidebar({
  activeRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  user,
  isAuthenticated,
  onLogout,
  onOpenGuide,
}) {
  const role = user?.role || 'guest';

  const renderSidebarBody = (mobileMode = false) => {
    const collapsed = !mobileMode && isCollapsed;

    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-forest-900 text-canvas-50">
        {/* Tekstur corak batik gelap & les vertikal rapi saat sidebar terbuka */}
        <BatikDarkBackdrop />
        {!collapsed ? <BatikSideBorder position="right" /> : null}

        {/* Header Logo & Tombol Buka/Tutup */}
        <div
          className={`relative z-10 flex items-center border-b border-soga-600/25 py-4 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4 pr-6'
          }`}
        >
          {!collapsed ? (
            <button
              type="button"
              onClick={() => {
                onNavigate('pos');
                if (mobileMode) onCloseMobile();
              }}
              className="flex min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-soga-600/40 bg-forest-800/80 p-1.5 shadow-sm">
                <img
                  src="/assets/logo_azrya_batik.png"
                  alt="Logo Azrya Batik"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display truncate text-base font-bold tracking-wider text-canvas-50">
                  AZRYA BATIK
                </p>
              </div>
            </button>
          ) : null}

          {mobileMode ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu samping"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-soga-600/30 text-canvas-50 hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Buka lebar sidebar' : 'Perkecil sidebar'}
              title={collapsed ? 'Buka Sidebar' : 'Tutup / Perkecil Sidebar'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-soga-600/30 bg-forest-800/70 text-soga-400 transition-colors hover:bg-soga-900 hover:text-canvas-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Menu Navigasi Utama */}
        <nav
          aria-label="Navigasi utama aplikasi"
          className={`relative z-10 flex-1 space-y-1.5 overflow-y-auto px-3 py-5 ${
            collapsed ? '' : 'pr-6'
          }`}
        >
          {!collapsed ? (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-soga-400/80">
              Menu Utama
            </p>
          ) : null}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            const isAllowed = item.roles.includes(role);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  if (mobileMode) onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex min-h-11 w-full items-center rounded-xl py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400 ${
                  collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'border border-soga-600/50 bg-forest-800 text-canvas-50 shadow-sm'
                    : 'border border-transparent text-sage-200/85 hover:bg-forest-800/55 hover:text-canvas-50'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-soga-900 text-canvas-50'
                      : 'bg-forest-800/70 text-soga-400 group-hover:text-canvas-50'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{item.label}</span>
                      {!isAllowed ? (
                        <Lock
                          className="h-3.5 w-3.5 shrink-0 text-soga-400"
                          aria-label="Khusus Pemilik"
                        />
                      ) : null}
                    </div>
                    <p className="truncate text-[11px] text-soga-400/85">{item.sublabel}</p>
                  </div>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bagian Bawah: Panduan, Sesi Login, & Identitas Capstone */}
        <div
          className={`relative z-10 space-y-2 border-t border-soga-600/25 p-3 ${
            collapsed ? '' : 'pr-6'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onOpenGuide();
              if (mobileMode) onCloseMobile();
            }}
            title={collapsed ? 'Panduan Pengguna' : undefined}
            className={`flex min-h-11 w-full items-center rounded-xl border border-soga-600/25 bg-forest-800/50 py-2 text-left text-xs font-medium text-sage-200 transition-colors hover:bg-forest-800 hover:text-canvas-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400 ${
              collapsed ? 'justify-center px-2' : 'gap-3 px-3'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0 text-soga-400" />
            {!collapsed ? <span>Panduan Foto Nota &amp; Kasir</span> : null}
          </button>

          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                if (mobileMode) onCloseMobile();
              }}
              title={collapsed ? 'Keluar Akun' : undefined}
              className={`flex min-h-11 w-full items-center rounded-xl py-2 text-left text-xs font-medium text-soga-400 transition-colors hover:bg-soga-900/40 hover:text-canvas-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-400 ${
                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Keluar ({user.role === 'owner' ? 'Pemilik' : 'Kasir'})</span> : null}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onNavigate('login');
                if (mobileMode) onCloseMobile();
              }}
              title={collapsed ? 'Masuk Akun' : undefined}
              className={`flex min-h-11 w-full items-center rounded-xl bg-soga-900 py-2 text-left text-xs font-semibold text-canvas-50 transition-colors hover:bg-soga-800 ${
                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
              }`}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Masuk ke Sistem</span> : null}
            </button>
          )}

          {!collapsed ? (
            <p className="px-2 pt-1 text-[11px] text-soga-400/75">
              Azrya Batik • Probolinggo
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (bisa dibuka-tutup) */}
      <aside
        aria-label="Sidebar desktop"
        className={`hidden shrink-0 border-r border-soga-600/30 transition-all duration-300 lg:block ${isCollapsed ? 'w-20' : 'w-72'
          }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarBody(false)}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-forest-900/65 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Sidebar seluler"
            className="relative z-10 h-full w-72 max-w-[85vw] shadow-elevated"
          >
            {renderSidebarBody(true)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
