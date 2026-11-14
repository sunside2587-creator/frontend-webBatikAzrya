import { useCallback, useEffect, useState } from 'react';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './hooks/useAuth';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { PosPage } from './pages/PosPage';
import { ExpensesOcrPage } from './pages/ExpensesOcrPage';
import { HppCalculatorPage } from './pages/HppCalculatorPage';
import { DashboardAiPage } from './pages/DashboardAiPage';
import { checkApiHealth } from './api/services/dashboardService';

function AzryaRouterApp() {
  const [activeRoute, setActiveRoute] = useState('pos');

  const navigate = useCallback((route) => {
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Warm-up health check saat inisialisasi sesi untuk mitigasi cold start free tier (PRD 5.3 & 6.2)
  useEffect(() => {
    checkApiHealth();
  }, []);

  const renderPage = () => {
    switch (activeRoute) {
      case 'login':
        return (
          <LoginPage
            onLoginSuccess={(loggedUser) => {
              navigate(loggedUser?.role === 'cashier' ? 'pos' : 'dashboard');
            }}
          />
        );
      case 'pos':
        return <PosPage />;
      case 'expenses':
        return <ExpensesOcrPage />;
      case 'hpp':
        return <HppCalculatorPage />;
      case 'dashboard':
        return <DashboardAiPage />;
      default:
        return <PosPage />;
    }
  };

  return (
    <AuthProvider onRequireLoginRedirect={() => navigate('login')}>
      <AppShell
        activeRoute={activeRoute}
        onNavigate={navigate}
      >
        {renderPage()}
      </AppShell>
      <ToastContainer />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AzryaRouterApp />
    </ToastProvider>
  );
}
