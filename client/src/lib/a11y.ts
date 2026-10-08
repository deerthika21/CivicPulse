/** A− / A / A+ text size, persisted per viewer. index.html applies it before first paint. */
export type FontSize = 'sm' | 'md' | 'lg';
const KEY = 'cp_fs';

export function getFontSize(): FontSize {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'sm' || v === 'lg' ? v : 'md';
  } catch {
    return 'md';
  }
}

export function setFontSize(size: FontSize): void {
  if (size === 'md') delete document.documentElement.dataset.fs;
  else document.documentElement.dataset.fs = size;
  try {
    localStorage.setItem(KEY, size);
  } catch {
    /* ignore */
  }
}

/** Heavy visuals (3D) only where they'll run smoothly and the viewer hasn't asked for less motion. */
export function canRunHeavyVisuals(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia('(max-width: 767px)').matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
