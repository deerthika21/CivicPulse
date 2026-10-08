import { LogIn, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Wordmark } from '@/components/gov/Emblem';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: '/report', label: t('navReport') },
    { to: '/track', label: t('navTrack') },
    { to: '/#how', label: t('navHow') },
  ];

  return (
    <header className="sticky top-0 z-[700]">
      <div className="border-b border-border/70 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="CivicPulse home" className="rounded-lg">
            <Wordmark sub={t('portalName')} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((l) =>
              l.to.startsWith('/#') ? (
                <a key={l.to} href={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  {l.label}
                </a>
              ) : (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn('rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {l.label}
                </NavLink>
              ),
            )}
            <span className="mx-2 h-5 w-px bg-border" aria-hidden />
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                <LogIn /> {t('staffLogin')}
              </Link>
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('menu')}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open && (
          <nav className="border-t border-border px-4 pb-4 pt-2 md:hidden" aria-label="Mobile">
            {[...links, { to: '/login', label: t('staffLogin') }].map((l) => (
              <a key={l.to} href={l.to} className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted">
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
      <div className="tricolour" aria-hidden />
    </header>
  );
}
