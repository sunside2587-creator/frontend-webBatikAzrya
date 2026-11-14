import { Menu, ShieldCheck, UserCheck } from 'lucide-react';
import { ROUTES, type RouteId } from '../../routes/routeConfig';
import type { User } from '../../types';
import { cn } from '../../utils/cn';
import { BatikHeaderRibbon } from '../ui/BatikOrnaments';

interface NavbarProps {
  activeTitle: string;
  onOpenMobileSidebar: () => void;
  user: User | null;
  onSwitchRole: (role: 'owner' | 'cashier') => void;
  onNavigate: (route: RouteId) => void;
}

export function Navbar({
  activeTitle,
  onOpenMobileSidebar,
  user,
  onSwitchRole,
  onNavigate,
}: NavbarProps) {
  const role = user?.role || 'guest';

  return (
    <header className="sticky top-0 z-30 border-b border-soga-600/30 bg-canvas-50/95 backdrop-blur">
      <BatikHeaderRibbon variant="light" />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Buka menu navigasi"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-soga-600/40 bg-white text-forest-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-soga-700">
              Galeri &amp; Sistem UMKM Probolinggo
            </p>
            <h2 className="font-display truncate text-base font-bold text-forest-900 sm:text-lg">
              {activeTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center rounded-xl border border-soga-600/35 bg-white p-1 sm:flex"
            role="group"
            aria-label="Pilih peran demo"
          >
            <button
              type="button"
              onClick={() => onSwitchRole('owner')}
              className={cn(
                'flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                role === 'owner'
                  ? 'bg-forest-900 text-canvas-50'
                  : 'text-forest-800 hover:bg-canvas-100'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Pemilik</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('cashier')}
              className={cn(
                'flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                role === 'cashier'
                  ? 'bg-soga-900 text-canvas-50'
                  : 'text-forest-800 hover:bg-canvas-100'
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Kasir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate(ROUTES.LOGIN)}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-soga-600/45 bg-soga-900 px-3.5 py-2 text-xs font-semibold text-canvas-50 transition-colors hover:bg-soga-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700 sm:text-sm"
          >
            <span className="max-w-24 truncate sm:max-w-none">
              {user ? user.nama.split(' ')[0] : 'Masuk'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
