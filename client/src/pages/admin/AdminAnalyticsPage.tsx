import { AlertTriangle, BarChart3, Brain, Camera, CheckCircle2, Clock, GitMerge, Inbox, Info, Lightbulb, MapPin, RefreshCw, ShieldCheck, Table2, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { toast } from 'sonner';
import { AiCore } from '@/components/AiCore';
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
import { PRIORITY_META } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useChartColors } from '@/lib/theme';
import type { Analytics, Insight } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Charts animate in once (bars grow from the baseline, areas draw left → right). */
const ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: 'ease-out' as const };

function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-card/95 px-3 py-2.5 text-xs shadow-lift backdrop-blur">
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
  const { t, lang } = useI18n();
  const [days, setDays] = useState(30);
  const analytics = useAsync(() => getAnalytics(days), [days]);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={`${new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('analyticsEyebrow')}`}
        title={t('analyticsTitle')}
        description={t('analyticsSub')}
        actions={
          <>
            <div className="flex h-9 items-center rounded-xl bg-muted p-1" role="group" aria-label="Period">
              {PERIODS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={days === d}
                  onClick={() => setDays(d)}
                  className={cn('h-7 rounded-lg px-3 text-[0.8125rem] font-semibold transition-all', days === d ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={() => analytics.reload(true)}>
              <RefreshCw /> {t('refresh')}
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
        <EmptyState title={t('noData')} />
      ) : analytics.data ? (
        <Dashboard a={analytics.data} />
      ) : null}
    </PageTransition>
  );
}

function Dashboard({ a }: { a: Analytics }) {
  const { t, lang } = useI18n();
  const c = useChartColors();
  const AXIS = { stroke: 'transparent', tick: { fill: c.tick, fontSize: 11 }, tickLine: false } as const;
  const GRID = { stroke: c.grid, vertical: false } as const;
  const k = a.kpis;
  const timeline = useMemo(() => a.timeline.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' }) })), [a.timeline, lang]);
  const categories = useMemo(() => [...a.byCategory].sort((x, y) => y.issues - x.issues), [a.byCategory]);
  const points = useMemo(() => a.points.map((p) => ({ ...p, muted: p.status === 'resolved' || p.status === 'rejected' })), [a.points]);
  const priorities = useMemo(() => a.byPriority.map((p) => ({ ...p, label: `P${p.priority}`, fill: PRIORITY_META[p.priority].color })), [a.byPriority]);
  const accepted = k.aiOverrideRate == null ? null : Math.round((100 - k.aiOverrideRate) * 10) / 10;

  const kpis: { icon: LucideIcon; label: string; value: number | null; suffix?: string; decimals?: number; hint: string; tone: Parameters<typeof StatCard>[0]['tone'] }[] = [
    { icon: Inbox, label: t('kpiComplaints'), value: k.complaints, hint: `${k.issues} unique · ${k.spamFiltered} spam`, tone: 'brand' },
    { icon: GitMerge, label: t('kpiDuplicates'), value: k.duplicatesMerged, hint: `${k.dedupRate ?? 0}% of reports`, tone: 'violet' },
    { icon: ShieldCheck, label: t('kpiOnTime'), value: k.slaCompliance, suffix: '%', decimals: 1, hint: `${k.breachedIssues} past deadline now`, tone: 'emerald' },
    { icon: Clock, label: t('kpiAvgFix'), value: k.avgResolutionHours, suffix: 'h', decimals: 1, hint: `${k.resolvedIssues} fixed · ${k.activeIssues} open`, tone: 'sky' },
    { icon: Brain, label: t('kpiConfidence'), value: k.avgConfidence, suffix: '%', hint: k.avgAiLatencyMs ? `~${(k.avgAiLatencyMs / 1000).toFixed(1)}s per complaint` : '—', tone: 'teal' },
    { icon: CheckCircle2, label: t('kpiAccepted'), value: accepted, suffix: '%', decimals: 1, hint: `${k.aiOverrideRate ?? 0}% overridden`, tone: 'emerald' },
    { icon: AlertTriangle, label: t('kpiFallback'), value: k.aiFallbackRate, suffix: '%', decimals: 1, hint: 'AI unavailable → defaults', tone: 'amber' },
    { icon: Camera, label: t('kpiMedia'), value: k.withPhoto + k.withAudio, hint: `${k.withPhoto} photo · ${k.withAudio} voice`, tone: 'slate' },
  ];

  return (
    <>
      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" step={0.04}>
        {kpis.map((s) => (
          <StaggerItem key={s.label} className="h-full">
            <StatCard {...s} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title={t('chartTrend')} description={`${t('chartTrendSub')} · ${a.days}d`} table={{ head: ['Date', 'In', 'Fixed'], rows: a.timeline.map((d) => [d.date, d.complaints, d.resolved]) }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillComplaints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.one} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={c.one} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.two} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={c.two} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={28} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.crosshair, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: c.label, paddingTop: 8 }} />
              <Area type="monotone" dataKey="complaints" name="In" stroke={c.one} strokeWidth={2} fill="url(#fillComplaints)" activeDot={{ r: 4, strokeWidth: 2, stroke: c.dotRing }} {...ANIM} />
              <Area type="monotone" dataKey="resolved" name="Fixed" stroke={c.two} strokeWidth={2} fill="url(#fillResolved)" activeDot={{ r: 4, strokeWidth: 2, stroke: c.dotRing }} {...ANIM} animationBegin={150} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('chartCategory')} description={t('chartCategorySub')} table={{ head: ['Category', 'Issues', 'Reports'], rows: a.byCategory.map((x) => [x.category, x.issues, x.reports]) }}>
          <ResponsiveContainer width="100%" height={Math.max(240, categories.length * 30)}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={7}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={176} {...AXIS} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor, radius: 6 }} />
              <Bar dataKey="issues" name="Issues" fill={c.one} radius={[0, 6, 6, 0]} maxBarSize={16} {...ANIM}>
                <LabelList dataKey="issues" position="right" fill={c.label} fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title={t('chartPriority')} table={{ head: ['Priority', 'Issues'], rows: a.byPriority.map((p) => [`P${p.priority}`, p.count]) }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorities} margin={{ top: 18, right: 4, left: -24, bottom: 0 }} barCategoryGap={10}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor, radius: 6 }} />
              <Bar dataKey="count" name="Issues" radius={[6, 6, 0, 0]} maxBarSize={40} {...ANIM}>
                {priorities.map((p) => (
                  <Cell key={p.priority} fill={p.fill} />
                ))}
                <LabelList dataKey="count" position="top" fill={c.label} fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('chartLanguage')} table={{ head: ['Language', 'Complaints'], rows: a.byLanguage.map((l) => [l.language, l.count]) }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.byLanguage} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={8}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="language" width={72} {...AXIS} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor, radius: 6 }} />
              <Bar dataKey="count" name="Complaints" fill={c.two} radius={[0, 6, 6, 0]} maxBarSize={18} {...ANIM}>
                <LabelList dataKey="count" position="right" fill={c.label} fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="gap-4">
          <div>
            <CardTitle>{t('topIssues')}</CardTitle>
            <CardDescription>{t('topIssuesSub')}</CardDescription>
          </div>
          {a.topIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('allClear')}</p>
          ) : (
            <ol className="space-y-2">
              {a.topIssues.map((x, i) => (
                <li key={x.id}>
                  <Link to={`/officer/issue/${x.id}`} className="flex gap-3 rounded-xl p-2 transition hover:bg-muted/60">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-sm font-medium text-foreground">{x.summary}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <PriorityBadge priority={x.priority} />
                        <Badge className="bg-brand-50 font-semibold text-brand-800 ring-brand-500/20">
                          {x.reportCount} {t('colReports').toLowerCase()}
                        </Badge>
                        <SlaBadge state={x.slaState} />
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
            <CardTitle>{t('deptTable')}</CardTitle>
            <CardDescription>{t('deptTableSub')}</CardDescription>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/60 text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">
                  <th className="px-6 py-2.5">{t('department')}</th>
                  <th className="px-2 py-2.5 text-right">{t('filterOpen')}</th>
                  <th className="px-2 py-2.5 text-right">{t('kpiPastDeadline')}</th>
                  <th className="px-2 py-2.5 text-right">{t('filterResolved')}</th>
                  <th className="px-2 py-2.5 text-right">Avg h</th>
                  <th className="w-44 px-6 py-2.5">{t('kpiOnTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {a.byDepartment.map((d) => (
                  <tr key={d.department} className="transition-colors hover:bg-muted/50">
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
                        <span className="text-xs text-subtle">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn('h-full rounded-full transition-[width] duration-700', d.slaCompliance >= 80 ? 'bg-teal-500' : d.slaCompliance >= 50 ? 'bg-amber-400' : 'bg-red-500')}
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
              <MapPin className="size-4 text-brand-600" /> {t('hotspotMap')}
            </CardTitle>
            <CardDescription>{t('hotspotMapSub')}</CardDescription>
          </div>
          <IssuesMap points={points} className="h-[360px]" onSelect={(id) => window.open(`/officer/issue/${id}`, '_self')} />
        </Card>
      </div>
    </>
  );
}

function ChartCard({ title, description, children, table }: { title: string; description?: string; children: ReactNode; table: { head: string[]; rows: (string | number)[][] } }) {
  const { t } = useI18n();
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className="gap-4">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable} aria-label={showTable ? t('showChart') : t('showTable')} title={showTable ? t('showChart') : t('showTable')}>
          {showTable ? <BarChart3 /> : <Table2 />}
        </Button>
      </CardHeader>
      {showTable ? (
        <div className="scrollbar-thin max-h-72 overflow-auto rounded-xl ring-1 ring-inset ring-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">
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
                  {r.map((cell, j) => (
                    <td key={j} className={cn('px-3 py-1.5', j > 0 && 'text-right tabular-nums')}>
                      {cell}
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

const HIGHLIGHT_COLS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' };

const SEVERITY: Record<Insight['highlights'][number]['severity'], { icon: LucideIcon; cls: string; iconCls: string }> = {
  info: { icon: Info, cls: 'bg-card ring-border', iconCls: 'bg-sky-50 text-sky-600' },
  warning: { icon: AlertTriangle, cls: 'bg-card ring-amber-200', iconCls: 'bg-amber-50 text-amber-600' },
  critical: { icon: AlertTriangle, cls: 'bg-card ring-red-200', iconCls: 'bg-red-50 text-red-600' },
};

function InsightsCard() {
  const { t } = useI18n();
  const insight = useAsync(getLatestInsight, []);
  const [generating, setGenerating] = useState(false);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInsight();
      insight.setData({ insight: res.insight });
      toast.success(t('briefUpdated'));
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
            <span className="flex size-11 items-center justify-center rounded-xl bg-navy-900 shadow-brand">
              <AiCore size={28} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">{t('aiNoticing')}</h2>
              {i && (
                <p className="text-xs text-subtle">
                  {new Date(i.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(i.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {timeAgo(i.createdAt)}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-9" onClick={regenerate} disabled={generating}>
            <RefreshCw className={cn(generating && 'animate-spin')} /> {generating ? t('preparing') : t('refreshBrief')}
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
          <EmptyState title={t('noBrief')} description={t('noBriefSub')} className="bg-card" />
        ) : (
          <>
            <p className="font-display text-xl font-bold leading-snug text-foreground md:text-[1.375rem]">{i.headline}</p>
            <Stagger className={cn('grid gap-3 md:grid-cols-2', HIGHLIGHT_COLS[Math.min(i.highlights.length, 4)])} step={0.05}>
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
                  <p className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-800">
                    <Lightbulb className="size-3.5" /> {t('recommendations')}
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
                  <p className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-teal-800">
                    <MapPin className="size-3.5" /> {t('hotspots')}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {i.hotspots.map((h, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2">
                        <span>
                          <span className="font-medium text-slate-800">{h.area}</span> <span className="text-subtle">· {h.category}</span>
                        </span>
                        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold tabular-nums text-teal-800 ring-1 ring-inset ring-teal-200">{h.count}</span>
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
