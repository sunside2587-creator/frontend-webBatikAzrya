import { Lock } from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IS_DEMO_MODE } from '../constants';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { PAGE_TITLES, ROUTES, VALID_ROUTES, type RouteId } from './routeConfig';

interface ProtectedRouteProps {
  allowedRoles: readonly UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, switchDemoRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={`/${ROUTES.LOGIN}`} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    const segment = location.pathname.replace(/^\/+/, '').split('/')[0] as RouteId;
    const activeTitle = VALID_ROUTES.includes(segment)
      ? PAGE_TITLES[segment]
      : 'ini';

    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soga-900/10 text-soga-900">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-forest-900">
            Khusus Pemilik
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-forest-800/80">
            Anda masuk sebagai{' '}
            <strong>{role === 'cashier' ? 'Kasir' : 'Tamu'}</strong>. Halaman{' '}
            <strong>{activeTitle}</strong> hanya bisa dibuka oleh Pemilik.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" onClick={() => navigate(`/${ROUTES.POS}`)}>
              Kembali ke Kasir
            </Button>
            {IS_DEMO_MODE ? (
              <Button variant="outline" onClick={() => switchDemoRole('owner')}>
                Ganti ke Pemilik (demo)
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
