import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { api, clearOwnerToken } from '../api/client';
import type { DashboardStats, StoreTodayStats } from '../types';
import { OwnerGate } from '../components/OwnerGate';
import { StatCard } from '../components/StatCard';
import { StoreAnalyticsSection } from '../components/StoreAnalyticsSection';
import { StoreHistorySection } from '../components/StoreHistorySection';
import { StoreTodayLogSection } from '../components/StoreTodayLogSection';
import { OrdersList } from '../components/OrdersList';
import { formatCurrency, formatOrderLocation } from '../utils/whatsapp';

const CHART_COLORS = ['#4c3b31', '#5a473c', '#6e5c51', '#7a6a5e', '#362920', '#cfc4b4'];

type DashboardTab = 'analytics' | 'todayLog' | 'orders' | 'storeHistory';

function DashboardContent() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [tab, setTab] = useState<DashboardTab>('analytics');
  const [orderStats, setOrderStats] = useState<DashboardStats | null>(null);
  const [storeStats, setStoreStats] = useState<StoreTodayStats | null>(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab !== 'analytics') return;
    setLoading(true);
    setError('');
    Promise.all([api.getStats(period), api.getStoreAnalytics()])
      .then(([orders, store]) => {
        setOrderStats(orders);
        setStoreStats(store);
      })
      .catch((err) => {
        if (err.message === 'Owner access required') {
          clearOwnerToken();
          window.location.reload();
        } else {
          setError(err instanceof Error ? err.message : t('common.error'));
        }
      })
      .finally(() => setLoading(false));
  }, [period, tab, t]);

  const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'analytics', label: t('dashboard.tabAnalytics') },
    { id: 'todayLog', label: t('dashboard.tabTodayLog') },
    { id: 'orders', label: t('dashboard.tabOrders') },
    { id: 'storeHistory', label: t('dashboard.tabStoreHistory') },
  ];

  const hasOrderData = orderStats && orderStats.summary.totalOrders > 0;
  const { summary, byArea, byDay, byOccasion, repeatCustomers } = orderStats ?? {
    summary: null,
    byArea: [],
    byDay: [],
    byOccasion: [],
    repeatCustomers: [],
  };

  const occasionData = (byOccasion ?? []).map((o) => ({
    name: t(`occasions.${o.occasion}`, { defaultValue: o.occasion }),
    value: o.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-brown">{t('dashboard.title')}</h2>
        <p className="mt-2 text-brown-muted">{t('dashboard.ownerSubtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-brown-border pb-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-t-lg px-5 py-2.5 text-sm font-medium transition ${
              tab === id
                ? 'bg-brown text-cream'
                : 'text-brown-muted hover:bg-cream-dark hover:text-brown'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && <OrdersList showTitle={false} />}

      {tab === 'todayLog' && (
        <div>
          <h3 className="mb-5 text-lg font-semibold text-brown">{t('dashboard.tabTodayLog')}</h3>
          <StoreTodayLogSection />
        </div>
      )}

      {tab === 'storeHistory' && (
        <div>
          <h3 className="mb-5 text-lg font-semibold text-brown">{t('dashboard.tabStoreHistory')}</h3>
          <StoreHistorySection />
        </div>
      )}

      {tab === 'analytics' && (
        <>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown-border border-t-brown" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-brown-border bg-cream-dark p-12 text-center">
              <p className="text-brown">{error}</p>
            </div>
          ) : (
            <div className="space-y-10">
              {storeStats && <StoreAnalyticsSection stats={storeStats} lang={lang} />}

              <div className="border-t border-brown-border pt-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-brown">{t('dashboard.deliveryOrders')}</h3>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-lg border border-brown-border bg-cream px-4 py-2 text-sm text-brown outline-none focus:border-brown"
                  >
                    <option value="7">{t('dashboard.period', { days: 7 })}</option>
                    <option value="30">{t('dashboard.period', { days: 30 })}</option>
                    <option value="90">{t('dashboard.period', { days: 90 })}</option>
                  </select>
                </div>

                {!hasOrderData ? (
                  <div className="rounded-xl border border-brown-border bg-cream-dark p-12 text-center">
                    <p className="text-lg text-brown-muted">{t('dashboard.noData')}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <StatCard
                        label={t('dashboard.totalRevenue')}
                        value={formatCurrency(summary!.totalRevenue, lang)}
                        icon={DollarSign}
                      />
                      <StatCard
                        label={t('dashboard.totalOrders')}
                        value={String(summary!.totalOrders)}
                        icon={ShoppingBag}
                      />
                      <StatCard
                        label={t('dashboard.avgOrder')}
                        value={formatCurrency(summary!.avgOrderValue, lang)}
                        icon={TrendingUp}
                      />
                      <StatCard
                        label={t('dashboard.pending')}
                        value={String(summary!.pendingOrders)}
                        icon={Clock}
                      />
                      <StatCard
                        label={t('dashboard.delivered')}
                        value={String(summary!.deliveredOrders)}
                        icon={CheckCircle}
                      />
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-brown-border bg-cream-dark p-5">
                        <h4 className="mb-4 font-semibold text-brown">{t('dashboard.revenueChart')}</h4>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={byDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cfc4b4" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#7a6a5e' }}
                              tickFormatter={(v) =>
                                new Date(v).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              }
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#7a6a5e' }} />
                            <Tooltip
                              formatter={(value) => formatCurrency(Number(value), lang)}
                              labelFormatter={(label) => formatChartDate(label as string, lang)}
                            />
                            <Bar dataKey="revenue" fill="#4c3b31" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="rounded-xl border border-brown-border bg-cream-dark p-5">
                        <h4 className="mb-4 font-semibold text-brown">{t('dashboard.byOccasion')}</h4>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={occasionData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {occasionData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-brown-border bg-cream-dark p-5">
                        <h4 className="mb-4 font-semibold text-brown">{t('dashboard.topAreas')}</h4>
                        <div className="space-y-3">
                          {byArea.map((area, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-brown-soft px-4 py-3"
                            >
                              <p className="font-medium text-brown">
                                {formatOrderLocation({ city: area.city, area: area.area })}
                              </p>
                              <div className="text-end">
                                <p className="font-semibold text-brown">
                                  {area.count} {t('dashboard.orders')}
                                </p>
                                <p className="text-xs text-brown-muted">
                                  {formatCurrency(area.revenue, lang)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-brown-border bg-cream-dark p-5">
                        <h4 className="mb-4 font-semibold text-brown">
                          {t('dashboard.repeatCustomers')}
                        </h4>
                        {repeatCustomers.length === 0 ? (
                          <p className="text-sm text-brown-muted">{t('dashboard.noData')}</p>
                        ) : (
                          <div className="space-y-3">
                            {repeatCustomers.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg border border-brown-border px-4 py-3"
                              >
                                <div>
                                  <p className="text-xs text-brown-muted">{t('dashboard.phone')}</p>
                                  <p className="font-medium text-brown" dir="ltr">
                                    {c.customer_phone}
                                  </p>
                                </div>
                                <div className="text-end">
                                  <p className="text-sm font-semibold text-brown">
                                    {c.orderCount} {t('dashboard.orders')}
                                  </p>
                                  <p className="text-xs text-brown-muted">
                                    {t('dashboard.spent')}: {formatCurrency(c.totalSpent, lang)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function DashboardPage() {
  return (
    <OwnerGate>
      <DashboardContent />
    </OwnerGate>
  );
}

function formatChartDate(dateStr: string, lang: string) {
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
