import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import { api } from '../api/client';
import type { Order } from '../types';
import { formatWhatsAppMessage, formatDate, formatCurrency, formatOrderLocation } from '../utils/whatsapp';

interface OrdersListProps {
  showTitle?: boolean;
}

export function OrdersList({ showTitle = true }: OrdersListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status !== 'all') params.status = status;
    if (search) params.search = search;
    api
      .getOrders(params)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  const handleCopy = async (order: Order) => {
    await navigator.clipboard.writeText(formatWhatsAppMessage(order, t, lang));
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatus = async (id: number, newStatus: string) => {
    await api.updateOrderStatus(id, newStatus);
    loadOrders();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('orders.confirmDelete'))) return;
    await api.deleteOrder(id);
    loadOrders();
  };

  const handleExportCustomers = async () => {
    setExporting(true);
    try {
      await api.exportCustomersCsv();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setExporting(false);
    }
  };

  const statusColors = {
    pending: 'bg-cream-dark text-brown',
    delivered: 'bg-brown-soft text-brown',
    cancelled: 'bg-cream text-brown-muted',
  };

  return (
    <div className="space-y-6">
      {showTitle && <h2 className="text-2xl font-semibold text-brown">{t('orders.title')}</h2>}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('orders.search')}
          className="min-w-[200px] flex-1 rounded-lg border border-brown-border bg-cream px-4 py-2.5 text-brown outline-none focus:border-brown"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-brown-border bg-cream px-4 py-2.5 text-brown outline-none focus:border-brown"
        >
          <option value="all">{t('orders.all')}</option>
          <option value="pending">{t('orders.pending')}</option>
          <option value="delivered">{t('orders.delivered')}</option>
          <option value="cancelled">{t('orders.cancelled')}</option>
        </select>
        <button
          type="button"
          onClick={handleExportCustomers}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-brown-border bg-cream px-4 py-2.5 text-sm font-medium text-brown transition hover:bg-brown-soft disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? t('orders.exporting') : t('orders.exportCustomers')}
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown-border border-t-brown" />
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-brown-border bg-cream-dark p-8 text-center text-brown-muted">
          {t('orders.noOrders')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brown-border bg-cream-dark">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-brown-border bg-brown-soft text-start">
                <th className="px-4 py-3 font-medium text-brown">{t('orders.orderNo')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.date')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.location')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.value')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.customer')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.status')}</th>
                <th className="px-4 py-3 font-medium text-brown">{t('orders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-brown-border/50 hover:bg-cream">
                  <td className="px-4 py-3 font-medium text-brown">{order.order_number}</td>
                  <td className="px-4 py-3 text-brown-muted">{formatDate(order.created_at, lang)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brown">{formatOrderLocation(order)}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-brown">
                    {formatCurrency(order.value, lang)}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {order.customer_phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}
                    >
                      {t(`status.${order.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(order)}
                        title={t('orders.copyMsg')}
                        className="rounded-lg p-1.5 text-brown-muted hover:bg-brown-soft hover:text-brown"
                      >
                        {copiedId === order.id ? (
                          <Check className="h-4 w-4 text-brown" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatus(order.id, 'delivered')}
                            title={t('orders.markDelivered')}
                            className="rounded-lg p-1.5 text-brown hover:bg-brown-soft"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatus(order.id, 'cancelled')}
                            title={t('orders.markCancelled')}
                            className="rounded-lg p-1.5 text-brown-muted hover:bg-cream-dark"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        title={t('orders.delete')}
                        className="rounded-lg p-1.5 text-brown-muted hover:bg-brown-soft hover:text-brown"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
