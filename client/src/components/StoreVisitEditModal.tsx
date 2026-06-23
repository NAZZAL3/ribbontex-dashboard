import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2 } from 'lucide-react';
import type { NoBuyReason, StoreVisit, StoreVisitOutcome } from '../types';
import { customReasonText, isCustomReason } from '../utils/storeReason';

const NO_BUY_REASONS: NoBuyReason[] = ['browsing', 'price', 'not_found', 'come_back', 'other'];

interface StoreVisitEditModalProps {
  visit: StoreVisit;
  onClose: () => void;
  onSave: (payload: {
    outcome: StoreVisitOutcome;
    value?: number;
    reason?: NoBuyReason;
    customReason?: string;
    created_at: string;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

function toDatetimeLocalValue(dateStr: string): string {
  return dateStr.replace(' ', 'T').slice(0, 16);
}

function fromDatetimeLocalValue(val: string): string {
  const normalized = val.length === 16 ? `${val}:00` : val;
  return normalized.replace('T', ' ');
}

function initialReason(visit: StoreVisit): NoBuyReason {
  if (isCustomReason(visit.reason)) return 'other';
  if (visit.reason && NO_BUY_REASONS.includes(visit.reason as NoBuyReason)) {
    return visit.reason as NoBuyReason;
  }
  return 'browsing';
}

export function StoreVisitEditModal({ visit, onClose, onSave, onDelete }: StoreVisitEditModalProps) {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<StoreVisitOutcome>(visit.outcome);
  const [value, setValue] = useState(String(visit.value ?? ''));
  const [reason, setReason] = useState<NoBuyReason>(initialReason(visit));
  const [customReason, setCustomReason] = useState(customReasonText(visit.reason));
  const [datetime, setDatetime] = useState(toDatetimeLocalValue(visit.created_at));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOutcome(visit.outcome);
    setValue(String(visit.value ?? ''));
    setReason(initialReason(visit));
    setCustomReason(customReasonText(visit.reason));
    setDatetime(toDatetimeLocalValue(visit.created_at));
    setError('');
  }, [visit]);

  const inputClass =
    'w-full rounded-lg border border-brown-border bg-cream px-4 py-3 text-base text-brown outline-none focus:border-brown focus:ring-2 focus:ring-brown-soft';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({
        outcome,
        value: outcome === 'bought' ? parseFloat(value) : undefined,
        reason: outcome === 'no_buy' ? reason : undefined,
        customReason: outcome === 'no_buy' && reason === 'other' ? customReason.trim() : undefined,
        created_at: fromDatetimeLocalValue(datetime),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('store.confirmDelete'))) return;
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-brown-border bg-cream p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-brown">{t('store.editEntry')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brown-muted transition hover:bg-cream-dark hover:text-brown"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-brown">{t('store.outcome')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('bought')}
                className={`rounded-lg border-2 px-4 py-4 text-base font-medium transition ${
                  outcome === 'bought'
                    ? 'border-brown bg-brown text-cream'
                    : 'border-brown-border bg-cream-dark text-brown hover:border-brown'
                }`}
              >
                ✅ {t('store.bought')}
              </button>
              <button
                type="button"
                onClick={() => setOutcome('no_buy')}
                className={`rounded-lg border-2 px-4 py-4 text-base font-medium transition ${
                  outcome === 'no_buy'
                    ? 'border-brown bg-brown text-cream'
                    : 'border-brown-border bg-cream-dark text-brown hover:border-brown'
                }`}
              >
                ❌ {t('store.noBuy')}
              </button>
            </div>
          </div>

          {outcome === 'bought' ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-brown">{t('store.orderValue')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-brown">{t('store.whyNoBuy')}</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as NoBuyReason)}
                  className={inputClass}
                >
                  {NO_BUY_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`store.reasons.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
              {reason === 'other' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-brown">
                    {t('store.customReason')}
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-brown">{t('store.dateTime')}</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className={inputClass}
              dir="ltr"
              required
            />
          </div>

          {error && <p className="text-sm text-brown">{error}</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brown py-3.5 text-base font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('store.saveChanges')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-brown-border px-4 py-3.5 text-base font-medium text-brown transition hover:bg-brown-soft disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {t('store.delete')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
