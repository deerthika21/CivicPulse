import { Link, Outlet } from 'react-router';
import { LogIn } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="relative flex rounded-full border border-border bg-white/70 p-1 text-xs font-semibold shadow-soft backdrop-blur" role="group" aria-label="Language">
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
          className={cn(
            'rounded-full px-3 py-1 transition-all duration-200',
            lang === code ? 'bg-brand-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Mobile-first shell for citizen pages. Pages own their own width. */
export function CitizenLayout() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-[600] border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="CivicPulse home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-slate-100 hover:text-foreground sm:inline-flex"
            >
              <LogIn className="size-3.5" /> {t('staffLogin')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-subtle sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <Logo className="scale-90" />
          </span>
          <span className="text-center">Greater Chennai civic complaints · AI triage by Gemini · Data on MongoDB Atlas</span>
          <Link to="/login" className="font-medium text-muted-foreground underline-offset-4 hover:underline">
            {t('staffLogin')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
