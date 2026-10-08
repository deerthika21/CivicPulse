import { CountUp } from '@/components/motion';
import { Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { getPublicStats } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/** Giant numbers from the real public stats endpoint. */
export function NumbersBand() {
  const { t } = useI18n();
  const stats = useAsync(getPublicStats, []);
  const s = stats.data;
  const dupPct = s && s.complaints ? Math.round((s.duplicatesMerged / s.complaints) * 100) : null;

  const items = s
    ? [
        { value: s.complaints, suffix: '', label: t('numComplaints') },
        { value: dupPct, suffix: '%', label: t('numDuplicates') },
        { value: s.resolvedIssues, suffix: '', label: t('numResolved') },
        { value: s.avgResolutionHours, suffix: 'h', label: t('numHours') },
      ]
    : [];

  return (
    <section className="theme-light bg-navy-950 py-24 text-white sm:py-32" aria-labelledby="num-title">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <h2 id="num-title" className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          {t('numbersTitle')}
        </h2>
        <div className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {stats.loading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 bg-white/10 [background-image:none]" />)
            : items.map((it) => (
                <div key={it.label} className="border-t border-white/15 pt-6">
                  <p className="text-gold-gradient font-display text-7xl font-extrabold leading-none tracking-tight xl:text-8xl">
                    {it.value == null ? '—' : <CountUp value={it.value} suffix={it.suffix} duration={1.4} />}
                  </p>
                  <p className="mt-4 text-lg text-slate-300">{it.label}</p>
                </div>
              ))}
        </div>
        {stats.error && <p className="mt-8 text-sm text-slate-400">{stats.error.message}</p>}
        <p className="mt-12 text-xs text-slate-500">{t('numbersNote')}</p>
      </div>
    </section>
  );
}
