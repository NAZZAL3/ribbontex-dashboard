import type { TFunction } from 'i18next';

export function formatStoreReason(reason: string | null, t: TFunction): string {
  if (!reason) return '';
  if (reason.startsWith('custom:')) return reason.slice(7);
  return t(`store.reasons.${reason}`, { defaultValue: reason });
}

export function isCustomReason(reason: string | null): boolean {
  return !!reason?.startsWith('custom:');
}

export function customReasonText(reason: string | null): string {
  return reason?.startsWith('custom:') ? reason.slice(7) : '';
}
