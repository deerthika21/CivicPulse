import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Building2, ChevronDown, ExternalLink, Inbox, LogOut, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Logo, LogoMark } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import type { AuthUser, Role } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV: { to: string; label: string; icon: typeof Inbox; roles: Role[] }[] = [
  { to: '/officer', label: 'Issue queue', icon: Inbox, roles: ['officer', 'admin'] },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
];

const COLLAPSE_KEY = 'cp_sidebar_collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function useNarrow(query = '(max-width: 1023px)') {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

/** Desktop-first shell for officer and admin pages; also the auth guard. */
export function StaffLayout({ roles = ['officer', 'admin'] }: { roles?: Role[] }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userCollapsed, setCollapsed] = useState(readCollapsed);
  const narrow = useNarrow();
  const collapsed = userCollapsed || narrow; // tablets get the icon rail automatically

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to="/officer" replace />;

  const nav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-dvh bg-background">
      {/* ---------- sidebar ---------- */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-[248px]',
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center' : 'px-5')}>
          <Link to="/officer">{collapsed ? <LogoMark /> : <Logo />}</Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {!collapsed && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">Workspace</p>}
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : 'px-3',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-active" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-600" />}
                  <Icon className={cn('size-[18px]', isActive && 'text-brand-600')} strokeWidth={2} />
                  {!collapsed && label}
                </>
              )}
            </NavLink>
          ))}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title={collapsed ? 'Citizen app' : undefined}
            className={cn('flex h-10 items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground', collapsed ? 'justify-center' : 'px-3')}
          >
            <ExternalLink className="size-[18px]" /> {!collapsed && 'Citizen app'}
          </a>
        </nav>
        <div className={cn('border-t border-border p-3', narrow && 'hidden')}>
          <button
            type="button"
            onClick={toggle}
            className={cn('flex h-10 w-full items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground', collapsed ? 'justify-center' : 'px-3')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} onLogout={logout} nav={nav} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 lg:px-8 lg:py-8 2xl:max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function TopBar({ user, onLogout, nav }: { user: AuthUser; onLogout: () => void; nav: typeof NAV }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const urlQ = location.pathname === '/officer' ? (params.get('q') ?? '') : '';
  const [q, setQ] = useState(urlQ);
  useEffect(() => setQ(urlQ), [urlQ]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/officer${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-[700] flex h-16 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-xl md:px-6 lg:px-8">
      <Link to="/officer" className="md:hidden">
        <LogoMark />
      </Link>
      <form onSubmit={onSearch} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search issues, areas…"
          aria-label="Search issues"
          className="h-10 w-full rounded-xl border border-border bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        {/* compact nav on small screens */}
        <nav className="flex items-center gap-1 md:hidden">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label} className={({ isActive }) => cn('rounded-lg p-2', isActive ? 'bg-brand-50 text-brand-700' : 'text-muted-foreground')}>
              <Icon className="size-4" />
            </NavLink>
          ))}
        </nav>
        <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-500/20 lg:inline-flex">
          <Building2 className="size-3.5" />
          {user.role === 'admin' ? 'All departments' : user.department}
        </span>
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initials = user.name
    .replace(/[^A-Za-z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">{initials || 'U'}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block text-[11px] capitalize text-subtle">{user.role}</span>
        </span>
        <ChevronDown className={cn('size-4 text-subtle transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-lift"
          >
            <div className="border-b border-border p-4">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <Building2 className="size-3" /> {user.role === 'admin' ? 'Administrator · all departments' : `${user.department} department`}
              </p>
            </div>
            <div className="p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
