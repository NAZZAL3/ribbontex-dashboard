import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { api } from '../api/client';
import type { StoreHistoryDay } from '../types';
import { formatCurrency, formatTime } from '../utils/whatsapp';
import { formatStoreReason } from '../utils/storeReason';

function formatDateLabel(dateStr: string, lang: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatHourLabel(hour: string, lang: string): string {
  const date = new Date();
  date.setHours(parseInt(hour, 10), 0, 0, 0);
  return date.toLocaleTimeString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    hour: 'numeric',
    hour12: true,
  });
}

export function StoreHistorySection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [days, setDays] = useState<StoreHistoryDay[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [openHours, setOpenHours] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api
      .getStoreHistory(period)
      .then((data) => {
        setDays(data.days);
        if (data.days.length > 0) {
          setOpenDates(new Set([data.days[0].date]));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleHour = (key: string) => {
    setOpenHours((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown-border border-t-brown" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-brown-muted">{t('dashboard.storeHistoryHint')}</p>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-brown-border bg-cream px-4 py-2 text-sm text-brown outline-none focus:border-brown"
        >
          <option value="7">{t('dashboard.period', { days: 7 })}</option>
          <option value="30">{t('dashboard.period', { days: 30 })}</option>
          <option value="90">{t('dashboard.period', { days: 90 })}</option>
          <option value="365">{t('dashboard.period', { days: 365 })}</option>
        </select>
      </div>

      {days.length === 0 ? (
        <p className="rounded-xl border border-brown-border bg-cream-dark p-12 text-center text-brown-muted">
          {t('dashboard.noStoreHistory')}
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const isOpen = openDates.has(day.date);
            return (
              <div key={day.date} className="overflow-hidden rounded-xl border border-brown-border bg-cream-dark">
                <button
                  type="button"
                  onClick={() => toggleDate(day.date)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start transition hover:bg-brown-soft/40"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-brown-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-brown-muted" />
                    )}
                    <div>
                      <p className="text-base font-semibold text-brown">
                        {formatDateLabel(day.date, lang)}
                      </p>
                      <p className="mt-1 text-sm text-brown-muted">
                        {day.totalVisitors} {t('store.totalVisitors').toLowerCase()} · {day.totalBuyers}{' '}
                        {t('store.bought').toLowerCase()} · {formatCurrency(day.revenue, lang)}
                      </p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-brown-border px-4 pb-4 pt-2 sm:px-6">
                    {day.hours.map((hourGroup) => {
                      const hourKey = `${day.date}-${hourGroup.hour}`;
                      const hourOpen = openHours.has(hourKey);
                      return (
                        <div key={hourKey} className="mt-3 rounded-lg border border-brown-border/60 bg-cream">
                          <button
                            type="button"
                            onClick={() => toggleHour(hourKey)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
                          >
                            <div className="flex items-center gap-2">
                              {hourOpen ? (
                                <ChevronDown className="h-4 w-4 text-brown-muted" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-brown-muted" />
                              )}
                              <Clock className="h-4 w-4 text-brown-muted" />
                              <span className="font-medium text-brown" dir="ltr">
                                {formatHourLabel(hourGroup.hour, lang)}
                              </span>
                              <span className="text-sm text-brown-muted">
                                ({hourGroup.visits.length})
                              </span>
                            </div>
                          </button>

                          {hourOpen && (
                            <ul className="divide-y divide-brown-border/40 border-t border-brown-border/40">
                              {hourGroup.visits.map((visit) => (
                                <li
                                  key={visit.id}
                                  className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">
                                      {visit.outcome === 'bought' ? '✅' : '❌'}
                                    </span>
                                    <span className="text-sm font-medium text-brown sm:text-base">
                                      {visit.outcome === 'bought'
                                        ? `${t('store.bought')} — ${formatCurrency(visit.value ?? 0, lang)}`
                                        : `${t('store.noBuy')} — ${formatStoreReason(visit.reason, t)}`}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-sm text-brown-muted" dir="ltr">
                                    {formatTime(visit.created_at, lang)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
