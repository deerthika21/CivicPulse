import { AlertTriangle, Brain, CheckCircle2, Clock, GitMerge, Inbox, Info, Lightbulb, MapPin, RefreshCw, ShieldCheck, Sparkles, Table2, BarChart3, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { toast } from 'sonner';
import { PriorityBadge, SlaBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { PageTransition, Stagger, StaggerItem } from '@/components/motion';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { generateInsight, getAnalytics, getLatestInsight } from '@/lib/api';
import { PRIORITY_META, SERIES } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import type { Analytics, Insight } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Chart chrome: recessive axes + soft gridlines, ink-coloured text, theme series colours. */
const AXIS = { stroke: 'transparent', tick: { fill: '#64748b', fontSize: 11 }, tickLine: false } as const;
const GRID = { stroke: '#eef2f7', vertical: false } as const;

function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-white/95 px-3 py-2.5 text-xs shadow-lift backdrop-blur">
      {label != null && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: (p.payload as { fill?: string })?.fill ?? p.color }} />
              {p.name}
            </span>
            <span className="font-bold tabular-nums text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

const PERIODS = [7, 30, 90];

export function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const analytics = useAsync(() => getAnalytics(days), [days]);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="City command centre"
        title="Analytics"
        description="Complaint volume, SLA performance and AI quality across all departments"
        actions={
          <>
            <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Period">
              {PERIODS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={days === d}
                  onClick={() => setDays(d)}
                  className={cn('rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all', days === d ? 'bg-white text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => analytics.reload(true)}>
              <RefreshCw /> Refresh
            </Button>
          </>
        }
      />

      <InsightsCard />

      {analytics.loading && !analytics.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))}
        </div>
      ) : analytics.error ? (
        <ErrorState error={analytics.error} onRetry={() => analytics.reload()} />
      ) : analytics.data && analytics.data.kpis.complaints === 0 ? (
        <EmptyState title="No complaints in this period" description="Try a longer period, or run the seed script to load demo data." />
      ) : analytics.data ? (
        <Dashboard a={analytics.data} />
      ) : null}
    </PageTransition>
  );
}

function Dashboard({ a }: { a: Analytics }) {
  const k = a.kpis;
  const timeline = useMemo(() => a.timeline.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })), [a.timeline]);
  const categories = useMemo(() => [...a.byCategory].sort((x, y) => y.issues - x.issues), [a.byCategory]);
  const points = useMemo(() => a.points.map((p) => ({ ...p, muted: p.status === 'resolved' || p.status === 'rejected' })), [a.points]);
  const priorities = useMemo(() => a.byPriority.map((p) => ({ ...p, label: `P${p.priority}`, fill: PRIORITY_META[p.priority].color })), [a.byPriority]);

  return (
    <>
      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" step={0.04}>
        {(
          [
            { icon: Inbox, label: 'Complaints', value: k.complaints, hint: `${k.issues} unique issues · ${k.spamFiltered} spam filtered`, tone: 'brand' },
            { icon: GitMerge, label: 'Duplicates merged', value: k.duplicatesMerged, hint: `${k.dedupRate ?? 0}% of reports deduplicated`, tone: 'violet' },
            { icon: ShieldCheck, label: 'SLA compliance', value: k.slaCompliance, suffix: '%', decimals: 1, hint: `${k.breachedIssues} active issues breached`, tone: 'emerald' },
            { icon: Clock, label: 'Avg. resolution', value: k.avgResolutionHours, suffix: 'h', decimals: 1, hint: `${k.resolvedIssues} resolved · ${k.activeIssues} active`, tone: 'sky' },
            { icon: Brain, label: 'AI confidence', value: k.avgConfidence, suffix: '%', hint: k.avgAiLatencyMs ? `~${(k.avgAiLatencyMs / 1000).toFixed(1)}s per triage` : 'Gemini triage', tone: 'teal' },
            {
              icon: CheckCircle2,
              label: 'AI accepted as-is',
              value: k.aiOverrideRate == null ? null : Math.round((100 - k.aiOverrideRate) * 10) / 10,
              suffix: '%',
              decimals: 1,
              hint: `${k.aiOverrideRate ?? 0}% overridden by officers`,
              tone: 'emerald',
            },
            { icon: AlertTriangle, label: 'AI fallback rate', value: k.aiFallbackRate, suffix: '%', decimals: 1, hint: 'Gemini unavailable → default triage', tone: 'amber' },
            { icon: Sparkles, label: 'Multimodal reports', value: k.withPhoto + k.withAudio, hint: `${k.withPhoto} photo · ${k.withAudio} voice`, tone: 'slate' },
          ] as const
        ).map((s) => (
          <StaggerItem key={s.label}>
            <StatCard {...s} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Complaints vs resolutions"
          description={`Daily, last ${a.days} days (IST)`}
          table={{ head: ['Date', 'Complaints', 'Resolved'], rows: a.timeline.map((d) => [d.date, d.complaints, d.resolved]) }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillComplaints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.one} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES.one} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.two} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={SERIES.two} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={28} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#475569', paddingTop: 8 }} />
              <Area type="monotone" dataKey="complaints" name="Complaints" stroke={SERIES.one} strokeWidth={2} fill="url(#fillComplaints)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke={SERIES.two} strokeWidth={2} fill="url(#fillResolved)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Issues by category" description="Unique issues after merging duplicates" table={{ head: ['Category', 'Issues', 'Reports'], rows: a.byCategory.map((c) => [c.category, c.issues, c.reports]) }}>
          <ResponsiveContainer width="100%" height={Math.max(240, categories.length * 30)}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={7}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={176} {...AXIS} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', radius: 6 }} />
              <Bar dataKey="issues" name="Issues" fill={SERIES.one} isAnimationActive={false} radius={[0, 6, 6, 0]} maxBarSize={16}>
                <LabelList dataKey="issues" position="right" fill="#475569" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Priority mix" description="AI / officer priority" table={{ head: ['Priority', 'Issues'], rows: a.byPriority.map((p) => [`P${p.priority}`, p.count]) }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={priorities} margin={{ top: 18, right: 4, left: -24, bottom: 0 }} barCategoryGap={10}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', radius: 6 }} />
              <Bar dataKey="count" name="Issues" isAnimationActive={false} radius={[6, 6, 0, 0]} maxBarSize={40}>
                {priorities.map((p) => (
                  <Cell key={p.priority} fill={p.fill} />
                ))}
                <LabelList dataKey="count" position="top" fill="#475569" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Languages" description="As detected by Gemini" table={{ head: ['Language', 'Complaints'], rows: a.byLanguage.map((l) => [l.language, l.count]) }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={a.byLanguage} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={8}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="language" width={72} {...AXIS} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', radius: 6 }} />
              <Bar dataKey="count" name="Complaints" fill={SERIES.two} isAnimationActive={false} radius={[0, 6, 6, 0]} maxBarSize={18}>
                <LabelList dataKey="count" position="right" fill="#475569" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="gap-4">
          <div>
            <CardTitle>Most-reported active issues</CardTitle>
            <CardDescription>Where citizens are most frustrated</CardDescription>
          </div>
          {a.topIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active issues.</p>
          ) : (
            <ol className="space-y-2">
              {a.topIssues.map((t, i) => (
                <li key={t.id}>
                  <Link to={`/officer/issue/${t.id}`} className="flex gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-sm font-medium text-foreground">{t.summary}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <PriorityBadge priority={t.priority} />
                        <Badge className="bg-brand-50 font-semibold text-brand-800 ring-brand-500/20">{t.reportCount} reports</Badge>
                        <SlaBadge state={t.slaState} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card className="gap-4 p-0">
          <div className="px-6 pt-6">
            <CardTitle>Department performance</CardTitle>
            <CardDescription>SLA compliance = closed within SLA ÷ all closed</CardDescription>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-border bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  <th className="px-6 py-2.5">Department</th>
                  <th className="px-2 py-2.5 text-right">Active</th>
                  <th className="px-2 py-2.5 text-right">Breached</th>
                  <th className="px-2 py-2.5 text-right">Resolved</th>
                  <th className="px-2 py-2.5 text-right">Avg hrs</th>
                  <th className="w-44 px-6 py-2.5">SLA compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {a.byDepartment.map((d) => (
                  <tr key={d.department} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-3 font-medium">{d.department}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{d.active}</td>
                    <td className="px-2 py-3 text-right tabular-nums">
                      {d.breached > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                          <AlertTriangle className="size-3" /> {d.breached}
                        </span>
                      ) : (
                        <span className="text-subtle">0</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{d.resolved}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{d.avgResolutionHours ?? '–'}</td>
                    <td className="px-6 py-3">
                      {d.slaCompliance == null ? (
                        <span className="text-xs text-subtle">No closures yet</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn('h-full rounded-full', d.slaCompliance >= 80 ? 'bg-teal-500' : d.slaCompliance >= 50 ? 'bg-amber-400' : 'bg-red-500')}
                              style={{ width: `${d.slaCompliance}%` }}
                            />
                          </div>
                          <span className="w-11 text-right text-xs font-semibold tabular-nums">{d.slaCompliance}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-600" /> Complaint hotspots
            </CardTitle>
            <CardDescription>Colour = priority · size = reports · faded = closed</CardDescription>
          </div>
          <IssuesMap points={points} className="h-[360px]" onSelect={(id) => window.open(`/officer/issue/${id}`, '_self')} />
        </Card>
      </div>
    </>
  );
}

function ChartCard({ title, description, children, table }: { title: string; description?: string; children: ReactNode; table: { head: string[]; rows: (string | number)[][] } }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className="gap-4">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable} aria-label={showTable ? 'Show chart' : 'Show table'} title={showTable ? 'Show chart' : 'Show table'}>
          {showTable ? <BarChart3 /> : <Table2 />}
        </Button>
      </CardHeader>
      {showTable ? (
        <div className="scrollbar-thin max-h-72 overflow-auto rounded-xl ring-1 ring-inset ring-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-subtle">
                {table.head.map((h, i) => (
                  <th key={h} className={cn('px-3 py-2', i > 0 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={cn('px-3 py-1.5', j > 0 && 'text-right tabular-nums')}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

const SEVERITY: Record<Insight['highlights'][number]['severity'], { icon: LucideIcon; cls: string; iconCls: string }> = {
  info: { icon: Info, cls: 'bg-white ring-border', iconCls: 'bg-sky-50 text-sky-600' },
  warning: { icon: AlertTriangle, cls: 'bg-white ring-amber-200', iconCls: 'bg-amber-50 text-amber-600' },
  critical: { icon: AlertTriangle, cls: 'bg-white ring-red-200', iconCls: 'bg-red-50 text-red-600' },
};

function InsightsCard() {
  const insight = useAsync(getLatestInsight, []);
  const [generating, setGenerating] = useState(false);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInsight();
      insight.setData({ insight: res.insight });
      toast.success(res.insight.aiFallback ? 'Insights generated (rule-based — Gemini unavailable)' : 'Fresh AI insights generated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const i = insight.data?.insight;
  return (
    <section className="gradient-border relative overflow-hidden rounded-2xl shadow-lift">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="relative space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-teal-gradient text-white shadow-brand">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">AI Weekly Insights</h2>
              {i && (
                <p className="text-xs text-subtle">
                  {new Date(i.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(i.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · generated{' '}
                  {timeAgo(i.createdAt)} · {i.aiFallback ? 'rule-based (Gemini unavailable)' : i.aiModel}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={regenerate} disabled={generating} className={cn(generating && 'animate-gradient bg-[length:200%_200%]')}>
            {generating ? <Sparkles className="animate-pulse" /> : <RefreshCw />} {generating ? 'Gemini is analysing…' : 'Regenerate'}
          </Button>
        </div>

        {insight.loading || generating ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : insight.error ? (
          <ErrorState error={insight.error} onRetry={() => insight.reload()} />
        ) : !i ? (
          <EmptyState icon={Sparkles} title="No insights yet" description="Insights are generated every Monday 8 AM IST. Generate one now." className="bg-white" />
        ) : (
          <>
            <p className="font-display text-xl font-bold leading-snug text-slate-900 md:text-[22px]">{i.headline}</p>
            <Stagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" step={0.05}>
              {i.highlights.map((h, idx) => {
                const s = SEVERITY[h.severity] ?? SEVERITY.info;
                return (
                  <StaggerItem key={idx} className={cn('flex gap-3 rounded-xl p-3.5 ring-1 ring-inset', s.cls)}>
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', s.iconCls)}>
                      <s.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{h.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{h.detail}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
            <div className="grid gap-5 md:grid-cols-2">
              {i.recommendations.length > 0 && (
                <div className="rounded-xl bg-brand-50/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-800">
                    <Lightbulb className="size-3.5" /> Recommendations
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-800">
                    {i.recommendations.map((r, idx) => (
                      <li key={idx} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {i.hotspots.length > 0 && (
                <div className="rounded-xl bg-teal-50/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    <MapPin className="size-3.5" /> Hotspots
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {i.hotspots.map((h, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2">
                        <span>
                          <span className="font-medium text-slate-800">{h.area}</span> <span className="text-subtle">· {h.category}</span>
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-teal-800 ring-1 ring-inset ring-teal-200">{h.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
