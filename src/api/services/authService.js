import apiClient from '../apiClient';

const DEMO_USERS = {
  'owner@azryabatik.id': {
    id: 'USR-01',
    nama: 'Ibu Azrya (Pemilik UMKM)',
    email: 'owner@azryabatik.id',
    role: 'owner',
  },
  'kasir@azryabatik.id': {
    id: 'USR-02',
    nama: 'Sandi (Admin / Kasir Galeri)',
    email: 'kasir@azryabatik.id',
    role: 'cashier',
  },
};

export async function loginRequest({ email, password }) {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const matched = DEMO_USERS[normalizedEmail];
      if (!matched || password !== 'azrya2026') {
        const authErr = new Error('Email atau kata sandi salah, silakan periksa kembali.');
        authErr.code = 'UNAUTHORIZED';
        authErr.status = 401;
        throw authErr;
      }
      return {
        status: 'success',
        message: 'Berhasil masuk ke sistem Azrya Batik (Mode Demo Lokal).',
        data: {
          token: `demo-jwt-${matched.role}-${Date.now()}`,
          user: matched,
        },
      };
    }
    throw error;
  }
}

export async function fetchCurrentUser() {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const saved = localStorage.getItem('azrya_user');
      if (saved) {
        return {
          status: 'success',
          data: JSON.parse(saved),
        };
      }
    }
    throw error;
  }
}
