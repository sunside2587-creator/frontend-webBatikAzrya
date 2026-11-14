import { lazy, Suspense, useCallback, useEffect, type ReactNode } from 'react';
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { KpiSkeletonGrid, TableSkeleton } from '../components/ui/Skeleton';
import { ToastContainer } from '../components/ui/Toast';
import { STORAGE_KEYS } from '../constants';
import { AuthProvider } from '../hooks/useAuth';
import { checkApiHealth } from '../services/dashboardService';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTE_ALLOWED_ROLES, ROUTES, VALID_ROUTES, type RouteId } from './routeConfig';

const PosPage = lazy(() => import('../pages/PosPage'));
const ExpensesOcrPage = lazy(() => import('../pages/ExpensesOcrPage'));
const HppCalculatorPage = lazy(() => import('../pages/HppCalculatorPage'));
const DashboardAiPage = lazy(() => import('../pages/DashboardAiPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));

function isStaticHtmlHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { protocol, port, pathname } = window.location;
  const numericPort = Number(port);
  return (
    protocol === 'file:' ||
    pathname.endsWith('.html') ||
    (numericPort >= 5500 && numericPort <= 5510)
  );
}

function getInitialRoutePath(): string {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.LAST_ROUTE) as RouteId | null;
    if (saved && VALID_ROUTES.includes(saved) && saved !== ROUTES.LOGIN) {
      return `/${saved}`;
    }
  } catch {
    // Abaikan jika sessionStorage dibatasi
  }
  return `/${ROUTES.POS}`;
}

function PageSuspenseFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <KpiSkeletonGrid />
      <TableSkeleton rows={4} />
    </div>
  );
}

function RouterProviderWrapper({ children }: { children: ReactNode }) {
  const futureFlags = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  };

  if (isStaticHtmlHost()) {
    return <HashRouter future={futureFlags}>{children}</HashRouter>;
  }

  return <BrowserRouter future={futureFlags}>{children}</BrowserRouter>;
}

function LoginRouteView() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLoginSuccess={(loggedUser) => {
        const target =
          loggedUser.role === 'cashier' ? `/${ROUTES.POS}` : `/${ROUTES.DASHBOARD}`;
        navigate(target);
      }}
    />
  );
}

function AzryaRouterShell() {
  const location = useLocation();
  const routerNavigate = useNavigate();

  const segment = location.pathname.replace(/^\/+/, '').split('/')[0] as RouteId;
  const isKnownRoute = VALID_ROUTES.includes(segment);
  const defaultPath = getInitialRoutePath();

  const handleRequireLoginRedirect = useCallback(() => {
    routerNavigate(`/${ROUTES.LOGIN}`);
  }, [routerNavigate]);

  // Simpan rute aktif agar saat halaman di-refresh tetap sinkron
  useEffect(() => {
    if (!isKnownRoute) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.LAST_ROUTE, segment);
    } catch {
      // Abaikan jika sessionStorage dibatasi
    }
  }, [isKnownRoute, segment]);

  // Warm-up health check saat inisialisasi sesi untuk mitigasi cold start
  useEffect(() => {
    const controller = new AbortController();
    checkApiHealth(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <AuthProvider onRequireLoginRedirect={handleRequireLoginRedirect}>
      <Suspense fallback={<PageSuspenseFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            <Route path="/index.html" element={<Navigate to={defaultPath} replace />} />
            <Route path={`/${ROUTES.LOGIN}`} element={<LoginRouteView />} />

            <Route
              element={<ProtectedRoute allowedRoles={ROUTE_ALLOWED_ROLES[ROUTES.POS]} />}
            >
              <Route path={`/${ROUTES.POS}`} element={<PosPage />} />
              <Route path={`/${ROUTES.EXPENSES}`} element={<ExpensesOcrPage />} />
            </Route>

            <Route
              element={<ProtectedRoute allowedRoles={ROUTE_ALLOWED_ROLES[ROUTES.HPP]} />}
            >
              <Route path={`/${ROUTES.HPP}`} element={<HppCalculatorPage />} />
              <Route path={`/${ROUTES.DASHBOARD}`} element={<DashboardAiPage />} />
            </Route>

            <Route path="*" element={<Navigate to={`/${ROUTES.POS}`} replace />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </AuthProvider>
  );
}

export function AppRouter() {
  return (
    <RouterProviderWrapper>
      <AzryaRouterShell />
    </RouterProviderWrapper>
  );
}
