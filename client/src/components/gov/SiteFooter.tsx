import { Link } from 'react-router';
import { Wordmark } from '@/components/gov/Emblem';
import { useI18n, type StringKey } from '@/lib/i18n';

type FooterLink = { label: StringKey; to?: string };

const COLUMNS: { title: StringKey; links: FooterLink[] }[] = [
  { title: 'footServices', links: [{ label: 'linkReport', to: '/report' }, { label: 'linkTrack', to: '/track' }, { label: 'linkDepartments' }, { label: 'staffLogin', to: '/login' }] },
  { title: 'footHelp', links: [{ label: 'linkFaq' }, { label: 'linkGrievance' }, { label: 'linkContact' }] },
  { title: 'footAccessibility', links: [{ label: 'linkA11yStatement' }, { label: 'linkScreenReader' }] },
  { title: 'footTransparency', links: [{ label: 'linkRti' }, { label: 'linkOpenData' }, { label: 'linkPrivacy' }, { label: 'linkTerms' }] },
];

/** Formal government-style footer. Links without a route are clearly marked placeholders. */
export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="theme-light bg-navy-950 text-slate-300">
      <div className="tricolour" aria-hidden />
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 space-y-4 lg:col-span-1">
            <Wordmark light sub={t('portalName')} />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">{t('footAboutBody')}</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={t(col.title)}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-soft">{t(col.title)}</h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="text-slate-300 underline-offset-4 transition hover:text-white hover:underline">
                        {t(l.label)}
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed text-slate-400" aria-disabled="true" title={t('placeholderLink')}>
                        {t(l.label)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl">
            <strong className="font-semibold text-slate-200">{t('disclaimer')}</strong>
          </p>
          <p>© 2026 CivicPulse · HN-AI-02</p>
        </div>
      </div>
    </footer>
  );
}
