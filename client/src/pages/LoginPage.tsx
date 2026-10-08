import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Droplets, GitMerge, Loader2, Lock, Mail, ShieldCheck, Sparkles, Trash2, Construction, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { HealthBadge } from '@/components/HealthBadge';
import { Logo } from '@/components/Logo';
import { Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const DEMO: { label: string; sub: string; email: string; password: string; icon: LucideIcon; tone: string }[] = [
  { label: 'Admin', sub: 'All departments · analytics', email: 'admin@civicpulse.in', password: 'Admin@123', icon: BarChart3, tone: 'from-brand-600 to-brand-800' },
  { label: 'Roads', sub: 'Roads officer', email: 'roads@civicpulse.in', password: 'Officer@123', icon: Construction, tone: 'from-orange-400 to-orange-600' },
  { label: 'Solid Waste', sub: 'SWM officer', email: 'swm@civicpulse.in', password: 'Officer@123', icon: Trash2, tone: 'from-teal-500 to-teal-700' },
  { label: 'Storm Drains', sub: 'Drains officer', email: 'drains@civicpulse.in', password: 'Officer@123', icon: Droplets, tone: 'from-sky-400 to-sky-600' },
];

export function LoginPage() {
  const { user, login } = useAuth();
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
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- brand panel ---------- */}
      <aside className="relative hidden overflow-hidden bg-brand-teal-gradient p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-grid-light" />
        <div className="pointer-events-none absolute -right-24 top-24 size-80 animate-float rounded-full bg-teal-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 size-72 animate-float rounded-full bg-indigo-300/30 blur-3xl [animation-delay:-3s]" />

        <Link to="/" className="relative">
          <Logo light />
        </Link>

        <div className="relative my-auto max-w-lg">
          <h1 className="font-display text-[42px] font-extrabold leading-[1.1] tracking-tight">
            One queue.
            <br />
            The right desk.
            <br />
            <span className="text-teal-200">Zero duplicates.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-indigo-100">
            Gemini triages every Chennai complaint — language, department, priority and SLA — so officers spend time fixing, not sorting.
          </p>

          {/* illustration-style floating shapes */}
          <div className="relative mt-12 h-48" aria-hidden>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute left-0 top-0 w-64 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-200">
                <Sparkles className="size-3.5" /> AI triage
              </p>
              <p className="mt-2 text-sm font-medium">Open manhole near fish market</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-white" /> P5 · Critical · 4h SLA
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="absolute left-48 top-24 w-60 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-200">
                <GitMerge className="size-3.5" /> Duplicates merged
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['bg-amber-300', 'bg-teal-300', 'bg-pink-300', 'bg-indigo-300'].map((c) => (
                    <span key={c} className={`size-6 rounded-full ring-2 ring-indigo-700 ${c}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold">5 reports → 1 issue</span>
              </div>
            </motion.div>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-indigo-100">
          <ShieldCheck className="size-4" /> Greater Chennai Corporation · Staff portal
        </p>
      </aside>

      {/* ---------- form ---------- */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <Stagger className="w-full max-w-md space-y-8" step={0.06}>
          <StaggerItem className="lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </StaggerItem>
          <StaggerItem className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your department workspace.</p>
          </StaggerItem>

          <StaggerItem>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required className="h-12 pl-10" placeholder="you@civicpulse.in" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                {loading === 'form' ? <Loader2 className="animate-spin" /> : null} Sign in <ArrowRight />
              </Button>
            </form>
          </StaggerItem>

          <StaggerItem className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-subtle">
              <span className="h-px flex-1 bg-border" /> One-click demo <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  disabled={!!loading}
                  onClick={() => submit(undefined, d)}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lift active:scale-[0.98] disabled:opacity-60',
                  )}
                >
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', d.tone)}>
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

          <StaggerItem className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <HealthBadge />
          </StaggerItem>
        </Stagger>
      </main>
    </div>
  );
}
