import { Activity, BarChart3, ExternalLink, Inbox, LogOut } from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV: { to: string; label: string; icon: typeof Inbox; end: boolean; roles: Role[] }[] = [
  { to: '/officer', label: 'Issue queue', icon: Inbox, end: false, roles: ['officer', 'admin'] },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false, roles: ['admin'] },
];

/** Desktop-first shell for officer and admin pages; also the auth guard. */
export function StaffLayout({ roles = ['officer', 'admin'] }: { roles?: Role[] }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to="/officer" replace />;

  return (
    <div className="flex min-h-dvh bg-muted/40">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-card p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2 font-semibold">
          <Activity className="size-5 text-primary" /> CivicPulse
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.filter((n) => n.roles.includes(user.role)).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent', isActive && 'bg-accent font-medium text-accent-foreground')
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
            <ExternalLink className="size-4" /> Citizen app
          </a>
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4">
          <div className="px-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role === 'admin' ? 'Administrator · all departments' : `${user.department} department`}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* compact top bar for smaller screens */}
        <header className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2 lg:hidden">
          <span className="flex items-center gap-2 font-semibold">
            <Activity className="size-5 text-primary" /> CivicPulse
          </span>
          <nav className="flex items-center gap-1">
            {NAV.filter((n) => n.roles.includes(user.role)).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('rounded-md p-2 hover:bg-accent', isActive && 'bg-accent')} aria-label={label}>
                <Icon className="size-4" />
              </NavLink>
            ))}
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
              <LogOut />
            </Button>
          </nav>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
