import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { api } from '../api/client';
import type { Order } from '../types';
import { OCCASION_OPTIONS, formatWhatsAppMessage } from '../utils/whatsapp';

export function NewOrderPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [location, setLocation] = useState('');
  const [value, setValue] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [occasion, setOccasion] = useState('general');
  const [notes, setNotes] = useState('');
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const order = await api.createOrder({
        location: location.trim(),
        value: parseFloat(value),
        customerPhone,
        occasion,
        notes,
      });
      setSavedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!savedOrder) return;
    const msg = formatWhatsAppMessage(savedOrder, t, lang);
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewOrder: Order | null =
    savedOrder ||
    (location && value && customerPhone
      ? {
          id: 0,
          order_number: 'RTN-????',
          city: '',
          area: location.trim(),
          street: '',
          value: parseFloat(value) || 0,
          customer_phone: customerPhone || '...',
          delivery_company: '',
          occasion,
          notes,
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      : null);

  const inputClass =
    'w-full rounded-lg border border-brown-border bg-cream px-4 py-3.5 text-base text-brown outline-none focus:border-brown focus:ring-2 focus:ring-brown-soft';

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-brown">{t('order.new')}</h2>
        <p className="mt-2 text-brown-muted">{t('order.newSubtitle')}</p>
      </div>

      <div className="rounded-xl border border-brown-border bg-cream-dark p-8 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="mb-2 block text-sm font-medium text-brown">{t('order.location')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('order.locationPlaceholder')}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-brown">{t('order.value')}</label>
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
            <div>
              <label className="mb-2 block text-sm font-medium text-brown">{t('order.phone')}</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={inputClass}
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brown">{t('order.occasion')}</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputClass}>
              {OCCASION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {t(`occasions.${o}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brown">{t('order.notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputClass} />
          </div>

          {error && <p className="text-sm text-brown">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brown py-4 text-base font-medium text-cream transition hover:bg-brown-dark disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('order.submit')}
          </button>
        </form>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-brown-border bg-cream-dark p-8 sm:p-10">
          <div className="mb-4 flex items-center gap-2 text-brown">
            <MessageCircle className="h-5 w-5 text-brown-muted" />
            <h3 className="font-semibold">{t('order.whatsappPreview')}</h3>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-cream p-5 text-sm leading-relaxed text-brown sm:text-base">
            {previewOrder ? formatWhatsAppMessage(previewOrder, t, lang) : '...'}
          </pre>
        </div>

        {savedOrder && (
          <div className="rounded-xl border border-brown-border bg-brown-soft p-8 sm:p-10">
            <p className="mb-4 font-medium text-brown">{t('order.saved')}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brown py-4 text-base font-medium text-cream transition hover:bg-brown-dark"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? t('order.copied') : t('order.copyWhatsApp')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
