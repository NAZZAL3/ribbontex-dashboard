import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import type { NoBuyReason, StoreVisit } from '../types';
import { formatTime } from '../utils/whatsapp';

type Step = 'choose' | 'bought' | 'no_buy' | 'other';

const QUICK_REASONS: NoBuyReason[] = ['browsing', 'price', 'not_found', 'come_back'];

export function StoreTrackerPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [step, setStep] = useState<Step>('choose');
  const [value, setValue] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setStep('choose');
    setValue('');
    setCustomReason('');
    setError('');
  };

  const flashSaved = (visit: StoreVisit) => {
    setSavedAt(formatTime(visit.created_at, lang));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSavedAt('');
      reset();
    }, 1200);
  };

  const handleBoughtSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const visit = await api.createStoreVisit({ outcome: 'bought', value: parseFloat(value) });
      flashSaved(visit);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleNoBuyReason = async (reason: NoBuyReason) => {
    if (reason === 'other') {
      setStep('other');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const visit = await api.createStoreVisit({ outcome: 'no_buy', reason });
      flashSaved(visit);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtherSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const visit = await api.createStoreVisit({
        outcome: 'no_buy',
        reason: 'other',
        customReason: customReason.trim(),
      });
      flashSaved(visit);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-brown-border bg-cream px-4 py-3.5 text-base text-brown outline-none focus:border-brown focus:ring-2 focus:ring-brown-soft';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-brown">{t('store.title')}</h2>
        <p className="mt-2 text-brown-muted">{t('store.staffSubtitle')}</p>
      </div>

      <div className="rounded-xl border border-brown-border bg-cream-dark p-8 sm:p-10">
        {saved ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-xl font-semibold text-brown">{t('store.saved')}</p>
            {savedAt && (
              <p className="text-sm text-brown-muted">
                {t('store.at')} {savedAt}
              </p>
            )}
          </div>
        ) : step === 'choose' ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep('bought')}
              className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-brown bg-brown px-6 py-8 text-cream transition hover:bg-brown-dark"
            >
              <span className="text-3xl">✅</span>
              <span className="text-xl font-semibold">{t('store.bought')}</span>
            </button>
            <button
              type="button"
              onClick={() => setStep('no_buy')}
              className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-brown-border bg-cream px-6 py-8 text-brown transition hover:border-brown hover:bg-brown-soft"
            >
              <span className="text-3xl">❌</span>
              <span className="text-xl font-semibold">{t('store.noBuy')}</span>
            </button>
          </div>
        ) : step === 'bought' ? (
          <form onSubmit={handleBoughtSave} className="space-y-7">
            <button
              type="button"
              onClick={reset}
              className="text-sm text-brown-muted transition hover:text-brown"
            >
              ← {t('store.back')}
            </button>
            <div>
              <label className="mb-2 block text-sm font-medium text-brown">{t('store.orderValue')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-brown">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brown py-4 text-base font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('store.save')}
            </button>
          </form>
        ) : step === 'other' ? (
          <form onSubmit={handleOtherSave} className="space-y-7">
            <button
              type="button"
              onClick={() => setStep('no_buy')}
              className="text-sm text-brown-muted transition hover:text-brown"
            >
              ← {t('store.back')}
            </button>
            <div>
              <label className="mb-2 block text-sm font-medium text-brown">
                {t('store.customReason')}
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className={inputClass}
                placeholder={t('store.customReasonPlaceholder')}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-brown">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brown py-4 text-base font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('store.save')}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="text-sm text-brown-muted transition hover:text-brown disabled:opacity-50"
            >
              ← {t('store.back')}
            </button>
            <p className="text-sm font-medium text-brown-muted">{t('store.whyNoBuy')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {QUICK_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  disabled={loading}
                  onClick={() => handleNoBuyReason(reason)}
                  className="rounded-xl border border-brown-border bg-cream px-5 py-5 text-start text-base font-medium text-brown transition hover:border-brown hover:bg-brown-soft disabled:opacity-60"
                >
                  {t(`store.reasons.${reason}`)}
                </button>
              ))}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleNoBuyReason('other')}
                className="rounded-xl border border-brown-border bg-cream px-5 py-5 text-start text-base font-medium text-brown transition hover:border-brown hover:bg-brown-soft disabled:opacity-60 sm:col-span-2"
              >
                {t('store.reasons.other')}
              </button>
            </div>
            {error && <p className="text-sm text-brown">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
