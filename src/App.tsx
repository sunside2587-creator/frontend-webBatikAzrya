import { ToastProvider } from './hooks/useToast';
import { AppRouter } from './routes/AppRouter';

export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
