import { ArrowRight, BarChart3, Construction, Droplets, Loader2, Lock, Mail, ShieldCheck, Trash2, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Wordmark } from '@/components/gov/Emblem';
import { UtilityBar } from '@/components/gov/UtilityBar';
import { HealthBadge } from '@/components/HealthBadge';
import { Stagger, StaggerItem } from '@/components/motion';
import { SceneSlot } from '@/components/three/SceneSlot';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const DEMO: { label: string; sub: string; email: string; password: string; icon: LucideIcon; tone: string }[] = [
  { label: 'Admin', sub: 'All departments', email: 'admin@civicpulse.in', password: 'Admin@123', icon: BarChart3, tone: 'bg-navy-900' },
  { label: 'Roads', sub: 'Officer', email: 'roads@civicpulse.in', password: 'Officer@123', icon: Construction, tone: 'bg-orange-500' },
  { label: 'Solid Waste', sub: 'Officer', email: 'swm@civicpulse.in', password: 'Officer@123', icon: Trash2, tone: 'bg-teal-600' },
  { label: 'Storm Drains', sub: 'Officer', email: 'drains@civicpulse.in', password: 'Officer@123', icon: Droplets, tone: 'bg-sky-600' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | false>(false);

  if (user) return <Navigate to={from ?? (user.role === 'admin' ? '/admin/analytics' : '/officer')} replace />;

  const submit = async (e?: FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setError('');
    setLoading(creds?.email ?? 'form');
    try {
      const u = await login(creds?.email ?? email, creds?.password ?? password);
      navigate(from ?? (u.role === 'admin' ? '/admin/analytics' : '/officer'), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <UtilityBar />
      <div className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- brand panel with the AI core ---------- */}
        <aside className="theme-light relative hidden overflow-hidden bg-navy-hero p-12 text-white lg:flex lg:flex-col">
          <SceneSlot variant="core" className="absolute inset-0 h-full w-full opacity-90" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
          <Link to="/" className="relative w-fit rounded-lg">
            <Wordmark light sub={t('portalName')} />
          </Link>
          <div className="relative mt-auto max-w-lg">
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
              {t('loginPanelTitle1')}
              <br />
              {t('loginPanelTitle2')}
              <br />
              <span className="text-gold-gradient">{t('loginPanelTitle3')}</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">{t('loginPanelBody')}</p>
            <p className="mt-10 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="size-4 text-gold-soft" /> Greater Chennai Corporation · Staff
            </p>
          </div>
        </aside>

        {/* ---------- form ---------- */}
        <main id="main" tabIndex={-1} className="flex items-center justify-center p-6 outline-none sm:p-10">
          <Stagger className="w-full max-w-md space-y-8" step={0.06}>
            <StaggerItem className="lg:hidden">
              <Link to="/" className="rounded-lg">
                <Wordmark sub={t('portalName')} />
              </Link>
            </StaggerItem>
            <StaggerItem className="space-y-2">
              <h2 className="font-display text-4xl font-extrabold tracking-tight">{t('loginTitle')}</h2>
              <p className="text-muted-foreground">{t('loginSub')}</p>
            </StaggerItem>

            <StaggerItem>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('workEmail')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required className="h-12 pl-10" placeholder="you@civicpulse.in" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="h-12 pl-10" placeholder="••••••••" />
                  </div>
                </div>
                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={!!loading}>
                  {loading === 'form' ? <Loader2 className="animate-spin" /> : null} {t('signIn')} <ArrowRight />
                </Button>
              </form>
            </StaggerItem>

            <StaggerItem className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                <span className="h-px flex-1 bg-border" /> {t('oneClickDemo')} <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    disabled={!!loading}
                    onClick={() => submit(undefined, d)}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', d.tone)}>
                      {loading === d.email ? <Loader2 className="size-4 animate-spin" /> : <d.icon className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{d.label}</span>
                      <span className="block truncate text-xs text-subtle">{d.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </StaggerItem>

            <StaggerItem className="border-t border-border pt-5">
              <HealthBadge />
            </StaggerItem>
          </Stagger>
        </main>
      </div>
    </div>
  );
}
