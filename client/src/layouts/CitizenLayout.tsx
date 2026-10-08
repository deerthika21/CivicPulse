import { Link, Outlet } from 'react-router';
import { Activity } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-full border bg-muted/50 p-0.5 text-xs font-medium" role="group" aria-label="Language">
      {(
        [
          ['en', 'EN'],
          ['ta', 'தமிழ்'],
        ] as const
      ).map(([code, label]) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={cn('rounded-full px-3 py-1 transition', lang === code ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Mobile-first shell for citizen pages. */
export function CitizenLayout() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-[600] border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Activity className="size-5 text-primary" /> CivicPulse
          </Link>
          <LanguageToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-6 text-center text-xs text-muted-foreground">
        Greater Chennai civic complaints · AI triage by Gemini ·{' '}
        <Link to="/login" className="underline underline-offset-2">
          {t('staffLogin')}
        </Link>
      </footer>
    </div>
  );
}
