import React, { useState } from 'react';
import { Lock, LogIn, ShieldCheck, UserCheck, BarChart3, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types/sitara';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password_hash === password
    );

    if (!matched) {
      setError('Username atau kata sandi tidak sesuai. Gunakan tombol Quick Login di bawah untuk pengujian.');
      return;
    }

    onLoginSuccess(matched);
  };

  const handleQuickLogin = (role: UserRole) => {
    setError('');
    const matched = users.find((u) => u.role === role);
    if (matched) {
      onLoginSuccess(matched);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-xs">
        {/* Left: Standard Credential Form */}
        <div className="md:col-span-7 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-emerald-700 text-sm font-semibold">
            <Lock className="w-4 h-4" />
            <span>Portal Autentikasi Internal</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">
            Masuk ke Dashboard SITARA
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Akses modul pemanggilan loket, pengaturan branding, atau laporan rekapitulasi pelayanan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="petugas / admin / pimpinan"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </button>
          </form>
        </div>

        {/* Right: Quick Login Buttons for Prototype Testing */}
        <div className="md:col-span-5 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Quick Login Prototipe
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Pilih salah satu peran di bawah untuk masuk langsung tanpa mengetik kredensial.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('petugas')}
                className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Masuk sebagai Petugas</div>
                  <div className="text-xs text-slate-500 font-mono-tabular">petugas / 12345</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Masuk sebagai Admin</div>
                  <div className="text-xs text-slate-500 font-mono-tabular">admin / 12345</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pimpinan')}
                className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Masuk sebagai Pimpinan</div>
                  <div className="text-xs text-slate-500 font-mono-tabular">pimpinan / 12345</div>
                </div>
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Hak akses disesuaikan otomatis berdasarkan peran pengguna.
          </p>
        </div>
      </div>
    </div>
  );
};
