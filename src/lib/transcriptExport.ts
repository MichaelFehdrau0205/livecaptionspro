import type { CaptionLine } from '@/types';

/** Format ms offset from session start as [HH:MM:SS] */
function formatOffset(startTime: number, createdAt: number): string {
  const elapsed = Math.max(0, Math.floor((createdAt - startTime) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `[${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}]`;
}

/** Format session date as "March 15, 2026" */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format session duration as "HH:MM:SS" */
function formatDuration(startTime: number, endTime: number): string {
  const elapsed = Math.max(0, Math.floor((endTime - startTime) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export interface TranscriptData {
  captions: CaptionLine[];
  sessionStartTime: number;
  sessionEndTime: number;
}

/** Returns the full transcript as a plain-text string with timestamps. */
export function buildTranscriptText({ captions, sessionStartTime, sessionEndTime }: TranscriptData): string {
  const date = formatDate(sessionStartTime);
  const duration = formatDuration(sessionStartTime, sessionEndTime);
  const lines = captions
    .filter((l) => l.words.length > 0)
    .map((l) => {
      const ts = l.createdAt ? formatOffset(sessionStartTime, l.createdAt) : '';
      const text = l.words.map((w) => w.text).join(' ');
      return ts ? `${ts} ${text}` : text;
    });

  return [
    'LIVE CAPTIONS PRO',
    `Date: ${date}  |  Duration: ${duration}`,
    '',
    ...lines,
  ].join('\n');
}

/**
 * Opens the browser print dialog with a formatted transcript.
 * User can "Save as PDF" from the dialog.
 */
export function printTranscript(data: TranscriptData): void {
  const date = formatDate(data.sessionStartTime);
  const duration = formatDuration(data.sessionStartTime, data.sessionEndTime);

  const lines = data.captions
    .filter((l) => l.words.length > 0)
    .map((l) => {
      const ts = l.createdAt ? formatOffset(data.sessionStartTime, l.createdAt) : '';
      const text = l.words.map((w) => w.text).join(' ');
      return `<tr>
        <td style="color:#888;font-size:12px;white-space:nowrap;padding:4px 12px 4px 0;vertical-align:top;font-family:monospace">${ts}</td>
        <td style="padding:4px 0;font-size:16px;line-height:1.6">${text}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Live Captions Pro — ${date}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #111; }
    .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: 0.05em; }
    .header p { margin: 0; font-size: 13px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>LIVE CAPTIONS PRO</h1>
    <p>Date: ${date} &nbsp;|&nbsp; Duration: ${duration}</p>
  </div>
  <table>${lines}</table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
