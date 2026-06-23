import { useTranslation } from 'react-i18next';
import { Users, ShoppingBag, TrendingUp, DollarSign, Clock, UserX, BarChart3 } from 'lucide-react';
import type { StoreTodayStats } from '../types';
import { StatCard } from './StatCard';
import { formatCurrency, formatHourLabel } from '../utils/whatsapp';
import { formatStoreReason } from '../utils/storeReason';

export function StoreAnalyticsSection({ stats, lang }: { stats: StoreTodayStats; lang: string }) {
  const { t } = useTranslation();
  const maxHourVisitors = Math.max(...stats.byHour.map((h) => h.visitors), 1);
  const peakHour = stats.byHour.reduce(
    (best, h) => (h.visitors > (best?.visitors ?? 0) ? h : best),
    stats.byHour[0]
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-brown">{t('dashboard.storeToday')}</h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('store.totalVisitors')} value={String(stats.totalVisitors)} icon={Users} />
        <StatCard label={t('store.totalBuyers')} value={String(stats.totalBuyers)} icon={ShoppingBag} />
        <StatCard
          label={t('store.conversionRate')}
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label={t('store.revenueToday')}
          value={formatCurrency(stats.revenueToday, lang)}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('store.avgSale')}
          value={formatCurrency(stats.avgOrderValue, lang)}
          icon={DollarSign}
        />
        <StatCard label={t('store.noBuyCount')} value={String(stats.noBuyCount)} icon={UserX} />
        <StatCard label={t('store.noBuyRate')} value={`${stats.noBuyRate.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard
          label={t('store.peakHour')}
          value={peakHour ? formatHourLabel(peakHour.hour, lang) : '—'}
          icon={Clock}
        />
      </div>

      {(stats.byReason.length > 0 || stats.byHour.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {stats.byReason.length > 0 && (
            <div className="rounded-xl border border-brown-border bg-cream-dark p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brown-muted" />
                <h4 className="font-semibold text-brown">{t('store.noBuyReasons')}</h4>
              </div>
              <div className="space-y-4">
                {stats.byReason.map((row) => {
                  const max = Math.max(...stats.byReason.map((r) => r.count), 1);
                  return (
                    <div key={row.reason}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium text-brown">
                          {formatStoreReason(row.reason, t)}
                        </span>
                        <span className="text-brown-muted">{row.count}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-brown"
                          style={{ width: `${(row.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.byHour.length > 0 && (
            <div className="rounded-xl border border-brown-border bg-cream-dark p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-brown-muted" />
                <h4 className="font-semibold text-brown">{t('store.byHour')}</h4>
              </div>
              <div className="space-y-3">
                {stats.byHour.map((row) => (
                  <div key={row.hour} className="flex items-center gap-4">
                    <span className="w-16 shrink-0 text-sm font-medium text-brown" dir="ltr">
                      {formatHourLabel(row.hour, lang)}
                    </span>
                    <div className="flex-1">
                      <div className="h-8 overflow-hidden rounded-lg bg-cream">
                        <div
                          className="flex h-full items-center rounded-lg bg-brown px-2 text-xs font-medium text-cream"
                          style={{
                            width: `${Math.max((row.visitors / maxHourVisitors) * 100, 8)}%`,
                          }}
                        >
                          {row.visitors}
                        </div>
                      </div>
                    </div>
                    <span className="hidden w-20 shrink-0 text-end text-xs text-brown-muted sm:block">
                      {row.buyers} {t('store.bought').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
