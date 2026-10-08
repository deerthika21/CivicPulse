/** Tracking codes this browser submitted — a per-device convenience only. */
const KEY = 'cp_my_reports';

export interface MyReport {
  code: string;
  summary: string;
  at: string;
}

export function getMyReports(): MyReport[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addMyReport(r: MyReport): void {
  try {
    const list = [r, ...getMyReports().filter((x) => x.code !== r.code)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
