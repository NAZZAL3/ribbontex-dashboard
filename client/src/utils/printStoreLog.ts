export interface PrintVisitRow {
  time: string;
  detail: string;
  bought: boolean;
}

export interface PrintHourGroup {
  hour: string;
  rows: PrintVisitRow[];
}

export interface PrintStoreLogOptions {
  title: string;
  subtitle?: string;
  summary?: string;
  printedAtLabel: string;
  printedAt: string;
  timeColumn: string;
  entryColumn: string;
  lang: string;
  flatRows?: PrintVisitRow[];
  hourGroups?: PrintHourGroup[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRowsHtml(rows: PrintVisitRow[], timeColumn: string, entryColumn: string): string {
  if (rows.length === 0) {
    return '<p class="empty">—</p>';
  }
  return `<table class="visits">
    <thead><tr><th>${escapeHtml(timeColumn)}</th><th>${escapeHtml(entryColumn)}</th></tr></thead>
    <tbody>
      ${rows
        .map(
          (row) =>
            `<tr>
              <td class="time" dir="ltr">${escapeHtml(row.time)}</td>
              <td>${row.bought ? '✅' : '❌'} ${escapeHtml(row.detail)}</td>
            </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
}

function buildPrintHtml(options: PrintStoreLogOptions): string {
  const { title, subtitle, summary, printedAtLabel, printedAt, timeColumn, entryColumn, lang, flatRows, hourGroups } =
    options;

  const bodyContent = hourGroups?.length
    ? hourGroups
        .map(
          (group) => `
        <section class="hour-block">
          <h3 dir="ltr">${escapeHtml(group.hour)}</h3>
          ${buildRowsHtml(group.rows, timeColumn, entryColumn)}
        </section>`
        )
        .join('')
    : buildRowsHtml(flatRows ?? [], timeColumn, entryColumn);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Inter", "Noto Sans Arabic", Arial, sans-serif;
      color: #4c3b31;
      margin: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: normal; color: #7a6a5e; margin: 0 0 12px; }
    .summary {
      background: #f5eed8;
      border: 1px solid #cfc4b4;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .meta { color: #7a6a5e; font-size: 11px; margin-bottom: 24px; }
    .hour-block { margin-bottom: 18px; page-break-inside: avoid; }
    .hour-block h3 {
      font-size: 14px;
      margin: 0 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #cfc4b4;
    }
    table.visits { width: 100%; border-collapse: collapse; }
    table.visits th, table.visits td {
      border: 1px solid #cfc4b4;
      padding: 8px 10px;
      text-align: start;
      vertical-align: top;
    }
    table.visits th { background: #ebe3d4; font-weight: 600; }
    table.visits td.time { white-space: nowrap; width: 90px; }
    .empty { color: #7a6a5e; }
    @media print {
      body { margin: 12px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>Ribbontex Nazzal</h1>
  <h2>${escapeHtml(title)}</h2>
  ${subtitle ? `<p class="summary">${escapeHtml(subtitle)}</p>` : ''}
  ${summary ? `<p class="summary">${escapeHtml(summary)}</p>` : ''}
  <p class="meta">${escapeHtml(printedAtLabel)}: <span dir="ltr">${escapeHtml(printedAt)}</span></p>
  ${bodyContent}
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
