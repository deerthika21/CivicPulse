const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(iso: string | Date): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** "3h 20m left" / "2d overdue" */
export function slaCountdown(dueIso: string): { text: string; overdue: boolean } {
  const ms = new Date(dueIso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const text = h >= 48 ? `${Math.round(h / 24)}d` : h >= 1 ? `${h}h ${m}m` : `${m}m`;
  return { text: ms >= 0 ? `${text} left` : `${text} overdue`, overdue: ms < 0 };
}

export function hours(h: number): string {
  return h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`;
}
