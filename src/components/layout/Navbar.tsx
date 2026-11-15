import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, LogOut, Menu, ShieldCheck, UserCheck } from 'lucide-react';
import { IS_DEMO_MODE } from '../../constants';
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
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Pemilik',
  cashier: 'Kasir',
  guest: 'Tamu',
};

function DemoRoleSwitcher({
  role,
  onSwitchRole,
}: {
  role: string;
  onSwitchRole: (role: 'owner' | 'cashier') => void;
}) {
  const options = [
    { id: 'owner' as const, label: 'Pemilik', icon: ShieldCheck },
    { id: 'cashier' as const, label: 'Kasir', icon: UserCheck },
  ];

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-[11px] font-medium text-forest-800/60">Mode demo</span>
      <div
        className="flex items-center rounded-lg border border-soga-600/30 bg-white p-0.5"
        role="group"
        aria-label="Pilih peran demo"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = role === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSwitchRole(option.id)}
              aria-pressed={isActive}
              className={cn(
                'flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-forest-900 text-canvas-50'
                  : 'text-forest-800 hover:bg-canvas-100'
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccountMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initial = user.nama.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-soga-600/30 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-forest-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soga-900 text-sm text-canvas-50">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.nama.split(' ')[0]}</span>
        <ChevronDown className="h-4 w-4 text-forest-800/70" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-soga-600/30 bg-white shadow-elevated"
        >
          <div className="border-b border-canvas-200 px-4 py-3">
            <p className="truncate text-sm font-semibold text-forest-900">{user.nama}</p>
            <p className="truncate text-xs text-forest-800/70">{user.email}</p>
            <p className="mt-1.5 inline-block rounded-md bg-canvas-100 px-2 py-0.5 text-[11px] font-semibold text-soga-900">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-danger-700 transition-colors hover:bg-danger-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Navbar({
  activeTitle,
  onOpenMobileSidebar,
  user,
  onSwitchRole,
  onNavigate,
  onLogout,
}: NavbarProps) {
  const role = user?.role || 'guest';

  return (
    <header className="sticky top-0 z-30 border-b border-soga-600/25 bg-canvas-50/95 backdrop-blur">
      <BatikHeaderRibbon variant="light" />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Buka menu navigasi"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-soga-600/30 bg-white text-forest-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <p className="font-display truncate text-lg font-semibold text-forest-900">
            {activeTitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {IS_DEMO_MODE && user ? (
            <DemoRoleSwitcher role={role} onSwitchRole={onSwitchRole} />
          ) : null}

          {user ? (
            <AccountMenu user={user} onLogout={onLogout} />
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(ROUTES.LOGIN)}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-soga-900 px-4 text-sm font-semibold text-canvas-50 transition-colors hover:bg-soga-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Masuk
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
