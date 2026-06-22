import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { BrandLogo } from '../components/BrandLogo';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden w-1/2 flex-col justify-between bg-brown p-12 lg:flex">
        <BrandLogo className="h-16 w-auto" />
        <p className="text-sm text-cream/70">{t('login.private')}</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 flex w-full max-w-md items-center justify-between lg:hidden">
          <BrandLogo className="h-10 w-auto" />
          <LanguageToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 hidden justify-end lg:flex">
            <LanguageToggle />
          </div>

          <div className="mb-2 flex items-center gap-2 text-brown-muted">
            <Lock className="h-4 w-4" />
            <span className="text-sm">{t('login.private')}</span>
          </div>
          <h1 className="text-3xl font-semibold text-brown">{t('login.title')}</h1>
          <p className="mt-2 text-brown-muted">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brown">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-brown-border bg-cream px-4 py-3 text-brown outline-none transition focus:border-brown focus:ring-2 focus:ring-brown-soft"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brown">
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-brown-border bg-cream px-4 py-3 text-brown outline-none transition focus:border-brown focus:ring-2 focus:ring-brown-soft"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-brown-soft px-4 py-2 text-sm text-brown">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brown py-3 font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
