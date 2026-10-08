import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Construction,
  Database,
  GitMerge,
  Inbox,
  Megaphone,
  Search,
  Server,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CountUp, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Input, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { getPublicStats } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { getMyReports } from '@/lib/myReports';

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const stats = useAsync(getPublicStats, []);
  const mine = getMyReports();

  const onTrack = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track/${code.trim().toUpperCase()}`);
  };

  const statItems: { value: number | null; label: string; icon: LucideIcon; suffix?: string }[] = stats.data
    ? [
        { value: stats.data.complaints, label: t('statsComplaints'), icon: Inbox },
        { value: stats.data.resolvedIssues, label: t('statsResolved'), icon: CheckCircle2 },
        { value: stats.data.duplicatesMerged, label: t('statsMerged'), icon: GitMerge },
      ]
    : [];

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 animate-float rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-20 top-40 size-64 animate-float rounded-full bg-teal-400/20 blur-3xl [animation-delay:-4s]" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_0.75fr] lg:pb-28 lg:pt-20">
          <Stagger step={0.07}>
            <StaggerItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-800 shadow-soft backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-500 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-teal-500" />
                </span>
                {t('heroEyebrow')}
              </span>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mt-5 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[54px]">
                {t('heroTitle1')} <span className="text-brand-gradient">{t('heroTitle2')}</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t('heroBody')}</p>
            </StaggerItem>
            <StaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link to="/report">
                  <Megaphone /> {t('reportIssue')} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <a href="#track">
                  <Search /> {t('trackComplaint')}
                </a>
              </Button>
            </StaggerItem>

            {/* live counters */}
            <StaggerItem className="mt-10">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> {t('liveStats')}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {stats.loading
                  ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[84px]" />)
                  : statItems.map(({ value, label, icon: Icon }) => (
                      <div key={label} className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-soft backdrop-blur sm:p-4">
                        <Icon className="mb-2 size-4 text-brand-600" />
                        <p className="font-display text-2xl font-bold leading-none text-slate-900 sm:text-3xl">
                          <CountUp value={value ?? 0} />
                        </p>
                        <p className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">{label}</p>
                      </div>
                    ))}
              </div>
            </StaggerItem>
          </Stagger>

          <HeroPreview />
        </div>
      </section>

      {/* ---------------- Track ---------------- */}
      <section id="track" className="relative mx-auto -mt-6 max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-lift sm:p-6">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
            <form onSubmit={onTrack} className="space-y-3">
              <label htmlFor="code" className="font-display text-lg font-bold">
                {t('trackComplaint')}
              </label>
              <p className="text-sm text-muted-foreground">{t('findComplaintHint')}</p>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="CP-XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoCapitalize="characters"
                  className="h-12 font-mono text-base tracking-wider"
                />
                <Button type="submit" size="lg" disabled={!code.trim()}>
                  <Search /> <span className="hidden sm:inline">{t('track')}</span>
                </Button>
              </div>
            </form>
            {mine.length > 0 && (
              <div className="space-y-2 md:border-l md:border-border md:pl-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{t('yourReports')}</p>
                {mine.slice(0, 3).map((r) => (
                  <Link
                    key={r.code}
                    to={`/track/${r.code}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm transition hover:border-brand-500/40 hover:bg-brand-50/50"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-mono text-xs font-bold text-brand-800">{r.code}</span>
                      <span className="text-muted-foreground"> · {r.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs text-subtle">{timeAgo(r.at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{t('howItWorks')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('stepReportTitle')} → {t('stepTriageTitle')} → {t('stepResolveTitle')}
          </h2>
        </div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-brand-200 via-brand-500/40 to-teal-300 md:block" aria-hidden />
          {(
            [
              { icon: Megaphone, title: t('stepReportTitle'), body: t('stepReportBody') },
              { icon: Sparkles, title: t('stepTriageTitle'), body: t('stepTriageBody') },
              { icon: CheckCircle2, title: t('stepResolveTitle'), body: t('stepResolveBody') },
            ] as const
          ).map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
              className="relative flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift md:block md:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex size-14 items-center justify-center md:size-[72px] rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 ring-1 ring-brand-100">
                  <Icon className="size-7 text-brand-600" strokeWidth={1.75} />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-brand">
                    {i + 1}
                  </span>
                </span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold md:mt-5">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground md:mt-2">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Trust strip ---------------- */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-7 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-subtle">{t('poweredBy')}</span>
          {(
            [
              { icon: Sparkles, name: 'Google Gemini', color: 'text-brand-600' },
              { icon: Database, name: 'MongoDB Atlas', color: 'text-emerald-600' },
              { icon: Server, name: 'Render', color: 'text-slate-700' },
            ] as const
          ).map(({ icon: Icon, name, color }) => (
            <span key={name} className="flex items-center gap-2 font-display text-base font-semibold text-slate-700">
              <Icon className={`size-5 ${color}`} /> {name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Decorative preview of an AI result — shows the product in the first 3 seconds. */
function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto hidden w-full max-w-md lg:block"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-brand-teal-gradient opacity-20 blur-2xl" />
      <div className="relative space-y-3">
        <div className="ml-auto w-[85%] rounded-2xl rounded-br-md border border-border bg-white p-4 text-sm shadow-lift">
          <p className="text-slate-800">“Anna Nagar 2nd avenue la periya pallam, bike la vizhunthutten 😟”</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Tanglish</span> just now
          </p>
        </div>
        <div className="gradient-border rounded-2xl p-5 shadow-lift">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
              <Sparkles className="size-3.5" /> Gemini triage · 1.8 s
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-500/25">
              <span className="size-2 rounded-full bg-orange-500" /> P4 · High
            </span>
          </div>
          <p className="mt-3 font-display text-[15px] font-semibold leading-snug text-slate-900">Large pothole on 2nd Avenue, Anna Nagar caused a two-wheeler fall.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[
              { icon: Construction, k: 'Category', v: 'Roads' },
              { icon: Building2, k: 'Desk', v: 'Roads Dept' },
              { icon: Clock, k: 'SLA', v: '24 hours' },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="rounded-xl bg-slate-50 p-2.5">
                <Icon className="size-3.5 text-brand-600" />
                <p className="mt-1.5 text-subtle">{k}</p>
                <p className="font-semibold text-slate-800">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-[80%] items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/90 p-3 text-xs shadow-soft backdrop-blur">
          <div className="flex -space-x-2">
            {['bg-brand-500', 'bg-teal-500', 'bg-amber-400'].map((c, i) => (
              <span key={i} className={`size-6 rounded-full ring-2 ring-white ${c}`} />
            ))}
          </div>
          <span className="font-semibold text-brand-800">Merged with 3 similar reports</span>
        </div>
      </div>
    </motion.div>
  );
}
