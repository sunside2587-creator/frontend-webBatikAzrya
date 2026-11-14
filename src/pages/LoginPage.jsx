import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BatikDarkBackdrop, BatikSectionDivider } from '../components/ui/BatikOrnaments';

export function LoginPage({ onLoginSuccess }) {
  const { login, isAuthLoading, user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('owner@azryabatik.id');
  const [password, setPassword] = useState('azrya2026');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Format email tidak valid. Contoh: owner@azryabatik.id';
    }
    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    try {
      const res = await login({ email: email.trim(), password });
      showToast(
        `Selamat datang, ${res.data.user.nama}. Sesi aktif sebagai ${res.data.user.role === 'owner' ? 'Pemilik UMKM' : 'Admin / Kasir'
        }.`,
        'success'
      );
      if (onLoginSuccess) {
        onLoginSuccess(res.data.user);
      }
    } catch (error) {
      setApiError(
        error.message || 'Email atau kata sandi salah, silakan periksa kembali.'
      );
    }
  };

  const fillDemoAccount = (targetRole, wrongPass = false) => {
    setApiError('');
    setFormErrors({});
    if (targetRole === 'owner') {
      setEmail('owner@azryabatik.id');
      setPassword(wrongPass ? 'salah123' : 'azrya2026');
    } else {
      setEmail('kasir@azryabatik.id');
      setPassword(wrongPass ? 'salah123' : 'azrya2026');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-soga-600/40 bg-white shadow-elevated lg:grid-cols-12">
        {/* Panel Kiri: Identitas Nusantara */}
        <div className="relative overflow-hidden bg-forest-900 p-6 text-canvas-50 sm:p-8 lg:col-span-5">
          <BatikDarkBackdrop />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-soga-600/50 bg-forest-800 p-1.5">
                  <img
                    src="/assets/logo_azrya_batik.png"
                    alt="Logo Azrya Batik"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-display text-lg font-bold tracking-wider">AZRYA BATIK</p>
                  <p className="text-xs text-soga-400">Probolinggo </p>
                </div>
              </div>

              <h1 className="mt-8 font-display text-2xl font-bold leading-snug text-canvas-50">
                Masuk ke Ruang Kerja Usaha
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-sage-200/90">
                Menu navigasi disesuaikan otomatis berdasarkan peran Pemilik UMKM atau Admin/Kasir sesuai aturan akses sistem.
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-soga-600/35 bg-forest-800/80 p-4 text-xs text-sage-200">
              <p className="font-semibold text-soga-400 uppercase tracking-wider">
                Hak Akses Peran
              </p>
              <p>
                <strong>Pemilik (Owner):</strong> Akses penuh POS, OCR Nota, Kalkulator HPP, dan Dashboard AI.
              </p>
              <p>
                <strong>Admin / Kasir:</strong> Akses operasional POS Penjualan dan Pengeluaran Nota OCR.
              </p>
            </div>
          </div>
        </div>

        {/* Panel Kanan: Form Autentikasi */}
        <div className="p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Formulir Masuk
            </h2>
            {user ? (
              <span className="rounded-full border border-sage-400/70 bg-sage-200/40 px-3 py-1 text-xs font-semibold text-forest-900">
                Aktif: {user.email}
              </span>
            ) : null}
          </div>

          {apiError ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <p className="font-semibold">Gagal Masuk (UNAUTHORIZED)</p>
                <p className="mt-0.5 text-red-800">{apiError}</p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Input
              id="login-email"
              type="email"
              label="Alamat Email"
              placeholder="owner@azryabatik.id"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
            />

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-forest-900">
                Kata Sandi
              </label>
              <div
                className={`flex min-h-11 items-center rounded-lg border bg-white px-3 focus-within:ring-2 focus-within:ring-soga-700 ${formErrors.password ? 'border-red-600' : 'border-soga-400/70'
                  }`}
              >
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent py-2 text-base text-forest-900 focus:outline-none"
                  placeholder="Masukkan kata sandi"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-forest-800 hover:bg-canvas-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password ? (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {formErrors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isAuthLoading}
              className="w-full"
            >
              <KeyRound className="h-4 w-4" />
              <span>Masuk ke Sistem</span>
            </Button>
          </form>

          <BatikSectionDivider label="Akun Demo Pengujian US-01" className="my-6" />

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fillDemoAccount('owner', false)}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Isi Pemilik</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fillDemoAccount('cashier', false)}
            >
              <UserCheck className="h-4 w-4" />
              <span>Isi Kasir</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fillDemoAccount('owner', true)}
              className="border-red-300 text-red-800 hover:bg-red-50"
            >
              <span>Uji Sandi Salah</span>
            </Button>
          </div>
          <p className="mt-2.5 text-xs text-forest-800/75">
            Kata sandi akun demo lokal: <code className="rounded bg-canvas-100 px-1.5 py-0.5 font-semibold">azrya2026</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
