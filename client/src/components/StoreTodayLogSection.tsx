import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Pencil, Printer } from 'lucide-react';
import { api } from '../api/client';
import type { StoreVisit } from '../types';
import { StoreVisitEditModal } from './StoreVisitEditModal';
import { formatCurrency, formatTime } from '../utils/whatsapp';
import { formatStoreReason } from '../utils/storeReason';
import { printStoreLog, buildPrintRows, buildPrintStats, buildReasonBreakdown } from '../utils/printStoreLog';

export function StoreTodayLogSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [visits, setVisits] = useState<StoreVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVisit, setEditingVisit] = useState<StoreVisit | null>(null);

  const loadLog = useCallback(() => {
    setLoading(true);
    api
      .getStoreTodayLog()
      .then((data) => setVisits(data.visits))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  function visitLabel(visit: StoreVisit): string {
    if (visit.outcome === 'bought') {
      return `${t('store.bought')} — ${formatCurrency(visit.value ?? 0, lang)}`;
    }
    return `${t('store.noBuy')} — ${formatStoreReason(visit.reason, t)}`;
  }

  const handlePrint = () => {
    const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn',
    });

    printStoreLog({
      title: t('dashboard.tabTodayLog'),
      subtitle: today,
      printedAtLabel: t('dashboard.printedOn'),
      printedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Amman' }),
      timeColumn: t('store.dateTime'),
      entryColumn: t('store.outcome'),
      lang,
      stats: buildPrintStats(
        visits,
        {
          visitors: t('store.totalVisitors'),
          buyers: t('store.totalBuyers'),
          conversion: t('store.conversionRate'),
          revenue: t('store.revenueToday'),
          avgSale: t('store.avgSale'),
          noBuy: t('store.noBuyCount'),
          noBuyRate: t('store.noBuyRate'),
          peakHour: t('store.peakHour'),
        },
        formatCurrency,
        lang
      ),
      rows: buildPrintRows(visits, (v) => formatTime(v.created_at, lang), visitLabel),
      reasonBreakdown: buildReasonBreakdown(visits, (v) =>
        v.outcome === 'no_buy' ? formatStoreReason(v.reason, t) : ''
      ),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-brown-muted">{t('dashboard.todayLogHint')}</p>
        <div className="flex items-center gap-3">
          {!loading && visits.length > 0 && (
            <>
              <span className="text-sm text-brown-muted">
                {visits.length} {t('store.entries')}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg border border-brown-border bg-cream px-4 py-2 text-sm font-medium text-brown transition hover:border-brown hover:bg-brown-soft"
              >
                <Printer className="h-4 w-4" />
                {t('dashboard.printTodayLog')}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown-border border-t-brown" />
        </div>
      ) : visits.length === 0 ? (
        <p className="rounded-xl border border-brown-border bg-cream-dark p-12 text-center text-base text-brown-muted">
          {t('store.noLog')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brown-border bg-cream-dark">
          <ul className="divide-y divide-brown-border/50">
            {visits.map((visit) => (
              <li
                key={visit.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{visit.outcome === 'bought' ? '✅' : '❌'}</span>
                  <div>
                    <p className="text-base font-semibold text-brown sm:text-lg">{visitLabel(visit)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-brown-muted">
                      <Clock className="h-4 w-4" />
                      <span dir="ltr">{formatTime(visit.created_at, lang)}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVisit(visit)}
                  className="flex items-center justify-center gap-2 self-start rounded-lg border border-brown-border bg-cream px-5 py-3 text-sm font-medium text-brown transition hover:border-brown hover:bg-brown-soft sm:self-center"
                >
                  <Pencil className="h-4 w-4" />
                  {t('store.edit')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editingVisit && (
        <StoreVisitEditModal
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={async (payload) => {
            await api.updateStoreVisit(editingVisit.id, payload);
            loadLog();
          }}
          onDelete={async () => {
            await api.deleteStoreVisit(editingVisit.id);
            loadLog();
          }}
        />
      )}
    </div>
  );
}
