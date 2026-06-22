import type { Order } from '../types';
import type { TFunction } from 'i18next';

export function formatOrderLocation(order: Pick<Order, 'city' | 'area'>): string {
  if (order.city && order.area) {
    return `${order.city}, ${order.area}`;
  }
  return order.area || order.city || '';
}

export function formatWhatsAppMessage(order: Order, t: TFunction, lang: string): string {
  const occasionLabel = t(`occasions.${order.occasion}`, { defaultValue: order.occasion });
  const location = formatOrderLocation(order);
  const lines =
    lang === 'ar'
      ? [
          `🎀 ${t('whatsapp.header')}`,
          '',
          `${t('whatsapp.orderNo')}: ${order.order_number}`,
          `${t('whatsapp.to')}: ${location}`,
          `${t('whatsapp.value')}: ${order.value} ${t('common.jd')}`,
          `${t('whatsapp.customer')}: ${order.customer_phone}`,
          `${t('whatsapp.occasion')}: ${occasionLabel}`,
          order.notes ? `${t('whatsapp.notes')}: ${order.notes}` : '',
        ]
      : [
          `🎀 ${t('whatsapp.header')}`,
          '',
          `${t('whatsapp.orderNo')}: ${order.order_number}`,
          `${t('whatsapp.to')}: ${location}`,
          `${t('whatsapp.value')}: ${order.value} ${t('common.jd')}`,
          `${t('whatsapp.customer')}: ${order.customer_phone}`,
          `${t('whatsapp.occasion')}: ${occasionLabel}`,
          order.notes ? `${t('whatsapp.notes')}: ${order.notes}` : '',
        ];

  return lines.filter(Boolean).join('\n');
}

export function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number, lang: string): string {
  return `${value.toFixed(2)} ${lang === 'ar' ? 'د.أ' : 'JD'}`;
}

export function formatTime(dateStr: string, lang: string): string {
  return new Date(dateStr.replace(' ', 'T')).toLocaleTimeString(lang === 'ar' ? 'ar-JO' : 'en-JO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const OCCASION_OPTIONS = [
  'general', 'wedding', 'birthday', 'newborn', 'graduation', 'engagement',
] as const;
