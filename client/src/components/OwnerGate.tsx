import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { api, clearOwnerToken, hasOwnerToken, setOwnerToken } from '../api/client';

export function OwnerGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(hasOwnerToken());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { ownerToken } = await api.verifyOwner(password);
      setOwnerToken(ownerToken);
      setUnlocked(true);
      setPassword('');
    } catch {
      setError(t('owner.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    clearOwnerToken();
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <div className="w-full rounded-xl border border-brown-border bg-cream-dark p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-brown-muted">
            <Lock className="h-5 w-5" />
            <span className="text-sm">{t('owner.locked')}</span>
          </div>
          <h2 className="text-2xl font-semibold text-brown">{t('owner.title')}</h2>
          <p className="mt-2 text-sm text-brown-muted">{t('owner.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brown">
                {t('owner.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-brown-border bg-cream px-4 py-3 text-brown outline-none focus:border-brown focus:ring-2 focus:ring-brown-soft"
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-brown">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brown py-3 font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('owner.unlock')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleLock}
          className="flex items-center gap-1.5 rounded-lg border border-brown-border px-3 py-1.5 text-sm text-brown-muted transition hover:bg-cream-dark hover:text-brown"
        >
          <Lock className="h-4 w-4" />
          {t('owner.lock')}
        </button>
      </div>
      {children}
    </div>
  );
}
