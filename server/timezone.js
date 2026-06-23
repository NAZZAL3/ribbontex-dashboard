const TIMEZONE = process.env.TZ || 'Asia/Amman';

export function ammanNow() {
  return new Date().toLocaleString('sv-SE', { timeZone: TIMEZONE });
}

export function ammanToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

export function ammanDateDaysAgo(days) {
  const date = new Date();
  date.setTime(date.getTime() - Number(days) * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}
