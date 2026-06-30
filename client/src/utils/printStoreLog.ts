import type { StoreVisit } from '../types';
import { formatHourLabel } from './whatsapp';

export interface PrintStat {
  label: string;
  value: string;
}

export interface PrintVisitRow {
  created_at: string;
  time: string;
  detail: string;
  bought: boolean;
}

export interface PrintStoreLogOptions {
  title: string;
  subtitle?: string;
  printedAtLabel: string;
  printedAt: string;
  timeColumn: string;
  entryColumn: string;
  lang: string;
  stats: PrintStat[];
  rows: PrintVisitRow[];
  reasonBreakdown?: { label: string; count: number }[];
}

export function buildPrintRows(
  visits: StoreVisit[],
  getTime: (visit: StoreVisit) => string,
  getDetail: (visit: StoreVisit) => string
): PrintVisitRow[] {
  return [...visits]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((visit) => ({
      created_at: visit.created_at,
      time: getTime(visit),
      detail: getDetail(visit),
      bought: visit.outcome === 'bought',
    }));
}

export function buildPrintStats(
  visits: StoreVisit[],
  labels: {
    visitors: string;
    buyers: string;
    conversion: string;
    revenue: string;
    avgSale: string;
    noBuy: string;
    peakHour: string;
    noBuyRate: string;
  },
  formatCurrency: (value: number, lang: string) => string,
  lang: string
): PrintStat[] {
  const total = visits.length;
  const buyers = visits.filter((v) => v.outcome === 'bought').length;
  const revenue = visits
    .filter((v) => v.outcome === 'bought')
    .reduce((sum, v) => sum + (v.value ?? 0), 0);
  const noBuy = total - buyers;

  const hourCounts = new Map<string, number>();
  for (const v of visits) {
    const hour = v.created_at.slice(11, 13);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }
  const peak = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return [
    { label: labels.visitors, value: String(total) },
    { label: labels.buyers, value: String(buyers) },
    {
      label: labels.conversion,
      value: total > 0 ? `${((buyers / total) * 100).toFixed(1)}%` : '0%',
    },
    { label: labels.revenue, value: formatCurrency(revenue, lang) },
    {
      label: labels.avgSale,
      value: buyers > 0 ? formatCurrency(revenue / buyers, lang) : formatCurrency(0, lang),
    },
    { label: labels.noBuy, value: String(noBuy) },
    {
      label: labels.noBuyRate,
      value: total > 0 ? `${((noBuy / total) * 100).toFixed(1)}%` : '0%',
    },
    {
      label: labels.peakHour,
      value: peak ? formatHourLabel(peak[0]) : '—',
    },
  ];
}

export function buildReasonBreakdown(
  visits: StoreVisit[],
  getReasonLabel: (visit: StoreVisit) => string
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of visits) {
    if (v.outcome !== 'no_buy') continue;
    const label = getReasonLabel(v);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hourKey(createdAt: string): string {
  return createdAt.slice(11, 13);
}

function buildCompactTable(
  rows: PrintVisitRow[],
  timeColumn: string,
  entryColumn: string,
  lang: string
): string {
  if (rows.length === 0) {
    return '<p class="empty">—</p>';
  }

  const body: string[] = [];
  let lastHour = '';

  rows.forEach((row, index) => {
    const hour = hourKey(row.created_at);
    if (hour !== lastHour) {
      lastHour = hour;
      body.push(
        `<tr class="hour-divider"><td colspan="3" dir="ltr">${escapeHtml(formatHourLabel(hour, lang))}</td></tr>`
      );
    }
    body.push(
      `<tr>
        <td class="num">${index + 1}</td>
        <td class="time" dir="ltr">${escapeHtml(row.time)}</td>
        <td>${row.bought ? '✅' : '❌'} ${escapeHtml(row.detail)}</td>
      </tr>`
    );
  });

  return `<table class="visits">
    <thead>
      <tr>
        <th class="num">#</th>
        <th>${escapeHtml(timeColumn)}</th>
        <th>${escapeHtml(entryColumn)}</th>
      </tr>
    </thead>
    <tbody>${body.join('')}</tbody>
  </table>`;
}

function buildPrintHtml(options: PrintStoreLogOptions): string {
  const {
    title,
    subtitle,
    printedAtLabel,
    printedAt,
    timeColumn,
    entryColumn,
    lang,
    stats,
    rows,
    reasonBreakdown,
  } = options;

  const statsHtml = stats
    .map(
      (s) =>
        `<div class="stat"><span class="stat-label">${escapeHtml(s.label)}</span><span class="stat-value">${escapeHtml(s.value)}</span></div>`
    )
    .join('');

  const reasonsHtml =
    reasonBreakdown && reasonBreakdown.length > 0
      ? `<div class="reasons">
          <p class="reasons-title">${lang === 'ar' ? 'أسباب عدم الشراء' : 'Why they didn\'t buy'}</p>
          <div class="reasons-list">
            ${reasonBreakdown
              .map(
                (r) =>
                  `<span class="reason-chip">${escapeHtml(r.label)} <strong>${r.count}</strong></span>`
              )
              .join('')}
          </div>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", "Noto Sans Arabic", Arial, sans-serif;
      color: #4c3b31;
      margin: 10px 12px;
      font-size: 10px;
      line-height: 1.25;
    }
    h1 { font-size: 15px; margin-bottom: 2px; }
    h2 { font-size: 11px; font-weight: normal; color: #7a6a5e; margin-bottom: 8px; }
    .meta { color: #7a6a5e; font-size: 9px; margin-bottom: 8px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }
    .stat {
      border: 1px solid #cfc4b4;
      border-radius: 4px;
      padding: 4px 6px;
      background: #f5eed8;
    }
    .stat-label { display: block; font-size: 8px; color: #7a6a5e; }
    .stat-value { display: block; font-size: 10px; font-weight: 600; margin-top: 1px; }
    .reasons { margin-bottom: 8px; }
    .reasons-title { font-size: 9px; font-weight: 600; margin-bottom: 3px; }
    .reasons-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .reason-chip {
      font-size: 9px;
      border: 1px solid #cfc4b4;
      border-radius: 3px;
      padding: 2px 5px;
      background: #fffced;
    }
    table.visits { width: 100%; border-collapse: collapse; }
    table.visits th, table.visits td {
      border: 1px solid #cfc4b4;
      padding: 2px 5px;
      text-align: start;
      vertical-align: middle;
    }
    table.visits th {
      background: #ebe3d4;
      font-weight: 600;
      font-size: 9px;
    }
    table.visits td { font-size: 9px; }
    table.visits td.num { width: 22px; text-align: center; color: #7a6a5e; }
    table.visits td.time { white-space: nowrap; width: 58px; }
    tr.hour-divider td {
      background: #ebe3d4;
      font-weight: 600;
      font-size: 8px;
      padding: 2px 5px;
      color: #4c3b31;
      border-color: #cfc4b4;
    }
    .empty { color: #7a6a5e; }
    @media print {
      body { margin: 8px; }
      @page { margin: 8mm; size: A4; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      tr.hour-divider { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1>Ribbontex Nazzal</h1>
  <h2>${escapeHtml(title)}${subtitle ? ` — ${escapeHtml(subtitle)}` : ''}</h2>
  <p class="meta">${escapeHtml(printedAtLabel)}: <span dir="ltr">${escapeHtml(printedAt)}</span></p>
  <div class="stats">${statsHtml}</div>
  ${reasonsHtml}
  ${buildCompactTable(rows, timeColumn, entryColumn, lang)}
</body>
</html>`;
}

function printViaIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  );
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const doc = frameWindow?.document;
  if (!doc || !frameWindow) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1500);
  };

  if (doc.readyState === 'complete') {
    runPrint();
  } else {
    iframe.addEventListener('load', runPrint, { once: true });
  }
}

export function printStoreLog(options: PrintStoreLogOptions): void {
  const html = buildPrintHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    printViaIframe(html);
    return;
  }

  const cleanup = () => URL.revokeObjectURL(url);
  let printed = false;

  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      printViaIframe(html);
    }
    cleanup();
  };

  win.addEventListener('load', runPrint, { once: true });
  setTimeout(runPrint, 800);
}
