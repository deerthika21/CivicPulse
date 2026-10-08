import { AlertTriangle, Brain, CheckCircle2, Clock, GitMerge, Info, Lightbulb, Loader2, MapPin, RefreshCw, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { PriorityBadge, SlaBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Select, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { generateInsight, getAnalytics, getLatestInsight } from '@/lib/api';
import { PRIORITY_META, SERIES } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import type { Analytics, Insight } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Chart chrome per dataviz reference: recessive grid/axes, text in ink tokens. */
const AXIS = { stroke: '#d6d5d0', tick: { fill: '#52514e', fontSize: 11 }, tickLine: false };
const GRID = { stroke: '#ecebe8', vertical: false };
const TOOLTIP = {
  contentStyle: { borderRadius: 8, border: '1px solid #e5e4df', fontSize: 12, boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' },
  cursor: { fill: 'rgb(0 0 0 / 0.04)' },
};

export function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const analytics = useAsync(() => getAnalytics(days), [days]);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">City analytics</h1>
          <p className="text-sm text-muted-foreground">Complaint volume, SLA performance and AI quality across all departments</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => analytics.reload(true)}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </div>

      <InsightsCard />

      {analytics.loading && !analytics.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : analytics.error ? (
        <ErrorState error={analytics.error} onRetry={() => analytics.reload()} />
      ) : analytics.data && analytics.data.kpis.complaints === 0 ? (
        <EmptyState title="No complaints in this period" description="Try a longer period, or run the seed script to load demo data." />
      ) : analytics.data ? (
        <Dashboard a={analytics.data} />
      ) : null}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: ReactNode; sub?: string; tone: string }) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn('flex size-7 items-center justify-center rounded-md', tone)}>
          <Icon className="size-3.5" />
        </span>
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

const pctText = (v: number | null) => (v == null ? '–' : `${v}%`);

function Dashboard({ a }: { a: Analytics }) {
  const k = a.kpis;
  const timeline = useMemo(() => a.timeline.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })), [a.timeline]);
  const categories = useMemo(() => [...a.byCategory].sort((x, y) => y.issues - x.issues), [a.byCategory]);
  const points = useMemo(
    () => a.points.map((p) => ({ ...p, muted: p.status === 'resolved' || p.status === 'rejected' })),
    [a.points],
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Info} label="Complaints" value={k.complaints.toLocaleString('en-IN')} sub={`${k.issues} unique issues · ${k.spamFiltered} spam filtered`} tone="bg-sky-50 text-sky-700" />
        <Kpi icon={GitMerge} label="Duplicates merged" value={k.duplicatesMerged} sub={`${pctText(k.dedupRate)} of reports deduplicated`} tone="bg-indigo-50 text-indigo-700" />
        <Kpi icon={ShieldCheck} label="SLA compliance" value={pctText(k.slaCompliance)} sub={`${k.breachedIssues} active issues breached`} tone="bg-emerald-50 text-emerald-700" />
        <Kpi icon={Clock} label="Avg. resolution" value={k.avgResolutionHours == null ? '–' : `${k.avgResolutionHours}h`} sub={`${k.resolvedIssues} resolved · ${k.activeIssues} active`} tone="bg-violet-50 text-violet-700" />
        <Kpi icon={Brain} label="AI confidence" value={k.avgConfidence == null ? '–' : `${k.avgConfidence}%`} sub={k.avgAiLatencyMs ? `~${(k.avgAiLatencyMs / 1000).toFixed(1)}s per triage` : undefined} tone="bg-teal-50 text-teal-700" />
        <Kpi icon={CheckCircle2} label="AI accepted as-is" value={k.aiOverrideRate == null ? '–' : `${Math.round((100 - k.aiOverrideRate) * 10) / 10}%`} sub={`${pctText(k.aiOverrideRate)} of issues overridden by officers`} tone="bg-emerald-50 text-emerald-700" />
        <Kpi icon={AlertTriangle} label="AI fallback rate" value={pctText(k.aiFallbackRate)} sub="Gemini unavailable → default triage" tone="bg-amber-50 text-amber-700" />
        <Kpi icon={Sparkles} label="Multimodal reports" value={k.withPhoto + k.withAudio} sub={`${k.withPhoto} photo · ${k.withAudio} voice`} tone="bg-pink-50 text-pink-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Complaints vs resolutions"
          description="Per day (IST)"
          table={{ head: ['Date', 'Complaints', 'Resolved'], rows: a.timeline.map((d) => [d.date, d.complaints, d.resolved]) }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...AXIS} allowDecimals={false} axisLine={false} />
              <Tooltip {...TOOLTIP} cursor={{ stroke: '#a3a29c', strokeDasharray: '3 3' }} />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: '#52514e' }} />
              <Line type="monotone" dataKey="complaints" name="Complaints" stroke={SERIES.one} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={SERIES.two} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Issues by category" description="Unique issues; reports include merged duplicates" table={{ head: ['Category', 'Issues', 'Reports'], rows: a.byCategory.map((c) => [c.category, c.issues, c.reports]) }}>
          <ResponsiveContainer width="100%" height={Math.max(200, a.byCategory.length * 30)}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={170} {...AXIS} axisLine={false} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="issues" name="Issues" fill={SERIES.one} isAnimationActive={false} radius={[0, 4, 4, 0]} maxBarSize={18}>
                <LabelList dataKey="issues" position="right" fill="#52514e" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Priority mix" description="Issues by AI / officer priority" table={{ head: ['Priority', 'Issues'], rows: a.byPriority.map((p) => [`P${p.priority}`, p.count]) }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.byPriority.map((p) => ({ ...p, label: `P${p.priority}` }))} margin={{ top: 16, right: 4, left: -24, bottom: 0 }} barCategoryGap={8}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} axisLine={false} />
              <Tooltip {...TOOLTIP} formatter={(v) => [v, 'Issues']} labelFormatter={(l, p) => `${l} · ${PRIORITY_META[p?.[0]?.payload?.priority]?.label ?? ''}`} />
              <Bar dataKey="count" isAnimationActive={false} radius={[4, 4, 0, 0]} maxBarSize={36}>
                {a.byPriority.map((p) => (
                  <Cell key={p.priority} fill={PRIORITY_META[p.priority].color} />
                ))}
                <LabelList dataKey="count" position="top" fill="#52514e" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Languages" description="As detected by Gemini" table={{ head: ['Language', 'Complaints'], rows: a.byLanguage.map((l) => [l.language, l.count]) }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.byLanguage} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="language" width={72} {...AXIS} axisLine={false} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="count" name="Complaints" fill={SERIES.one} isAnimationActive={false} radius={[0, 4, 4, 0]} maxBarSize={20}>
                <LabelList dataKey="count" position="right" fill="#52514e" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="gap-3">
          <div>
            <CardTitle>Most-reported active issues</CardTitle>
            <CardDescription>Where citizens are most frustrated</CardDescription>
          </div>
          {a.topIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active issues.</p>
          ) : (
            <ol className="space-y-2">
              {a.topIssues.map((t) => (
                <li key={t.id}>
                  <Link to={`/officer/issue/${t.id}`} className="block rounded-lg border p-2.5 hover:bg-muted/50">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={t.priority} />
                      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-800">{t.reportCount} reports</Badge>
                      <SlaBadge state={t.slaState} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm">{t.summary}</p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="gap-3">
          <div>
            <CardTitle>Department performance</CardTitle>
            <CardDescription>SLA compliance = closed within SLA ÷ all closed</CardDescription>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Department</th>
                  <th className="px-2 text-right font-medium">Active</th>
                  <th className="px-2 text-right font-medium">Breached</th>
                  <th className="px-2 text-right font-medium">Resolved</th>
                  <th className="px-2 text-right font-medium">Avg hrs</th>
                  <th className="w-36 pl-2 font-medium">SLA compliance</th>
                </tr>
              </thead>
              <tbody>
                {a.byDepartment.map((d) => (
                  <tr key={d.department} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-medium">{d.department}</td>
                    <td className="px-2 text-right tabular-nums">{d.active}</td>
                    <td className={cn('px-2 text-right tabular-nums', d.breached > 0 && 'font-semibold text-red-700')}>
                      {d.breached > 0 && <AlertTriangle className="mr-1 inline size-3" />}
                      {d.breached}
                    </td>
                    <td className="px-2 text-right tabular-nums">{d.resolved}</td>
                    <td className="px-2 text-right tabular-nums">{d.avgResolutionHours ?? '–'}</td>
                    <td className="pl-2">
                      {d.slaCompliance == null ? (
                        <span className="text-xs text-muted-foreground">no closures</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${d.slaCompliance}%`, background: SERIES.one }} />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums">{d.slaCompliance}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="gap-3">
          <div>
            <CardTitle>Complaint map</CardTitle>
            <CardDescription>Colour = priority, size = number of reports, faded = closed</CardDescription>
          </div>
          <IssuesMap points={points} className="h-80" onSelect={(id) => window.open(`/officer/issue/${id}`, '_self')} />
        </Card>
      </div>
    </>
  );
}

function ChartCard({ title, description, children, table }: { title: string; description?: string; children: ReactNode; table: { head: string[]; rows: (string | number)[][] } }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable}>
          {showTable ? 'Chart' : 'Table'}
        </Button>
      </div>
      {showTable ? (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {table.head.map((h, i) => (
                  <th key={h} className={cn('py-1.5 font-medium', i > 0 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {r.map((c, j) => (
                    <td key={j} className={cn('py-1.5', j > 0 && 'text-right tabular-nums')}>
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

const SEVERITY: Record<Insight['highlights'][number]['severity'], { icon: LucideIcon; cls: string }> = {
  info: { icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-900' },
  warning: { icon: AlertTriangle, cls: 'border-amber-200 bg-amber-50 text-amber-900' },
  critical: { icon: AlertTriangle, cls: 'border-red-200 bg-red-50 text-red-900' },
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
    <Card className="gap-4 border-primary/30 bg-gradient-to-br from-accent/60 to-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Weekly AI insights
          </CardTitle>
          {i && (
            <CardDescription>
              {new Date(i.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(i.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · generated {timeAgo(i.createdAt)} ·{' '}
              {i.aiFallback ? 'rule-based (Gemini unavailable)' : i.aiModel}
            </CardDescription>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={regenerate} disabled={generating}>
          {generating ? <Loader2 className="animate-spin" /> : <RefreshCw />} {generating ? 'Analysing…' : 'Regenerate'}
        </Button>
      </div>

      {insight.loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20" />
        </div>
      ) : insight.error ? (
        <ErrorState error={insight.error} onRetry={() => insight.reload()} />
      ) : !i ? (
        <EmptyState icon={Sparkles} title="No insights yet" description="Insights are generated every Monday 8 AM IST. Generate one now." className="bg-card" />
      ) : (
        <>
          <p className="text-lg font-semibold leading-snug">{i.headline}</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {i.highlights.map((h, idx) => {
              const s = SEVERITY[h.severity] ?? SEVERITY.info;
              return (
                <div key={idx} className={cn('rounded-lg border p-3', s.cls)}>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <s.icon className="size-3.5" /> {h.title}
                  </p>
                  <p className="mt-1 text-sm">{h.detail}</p>
                </div>
              );
            })}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {i.recommendations.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lightbulb className="size-3.5" /> Recommendations
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {i.recommendations.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {i.hotspots.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="size-3.5" /> Hotspots
                </p>
                <ul className="space-y-1 text-sm">
                  {i.hotspots.map((h, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span>
                        {h.area} · <span className="text-muted-foreground">{h.category}</span>
                      </span>
                      <span className="font-medium tabular-nums">{h.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
