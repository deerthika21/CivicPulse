import { AlertTriangle, CheckCircle2, Clock, Flame, Inbox, MapPin, RefreshCw, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AiFallbackBadge, CategoryIcon, PriorityBadge, ReportCountBadge, SlaBadge, StatusBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { PageTransition } from '@/components/motion';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Select, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { getMeta, getQueueSummary, listIssues } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PRIORITY_META } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import type { Issue } from '@/lib/types';
import { cn } from '@/lib/utils';

const REFRESH_MS = 60_000;

const STATUS_CHIPS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export function OfficerQueuePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hovered, setHovered] = useState<string>();

  const filters = {
    status: params.get('status') ?? 'active',
    department: isAdmin ? (params.get('department') ?? '') : undefined,
    category: params.get('category') ?? '',
    priority: params.get('priority') ?? '',
    sla: params.get('sla') ?? '',
    q: params.get('q') ?? '',
    sort: params.get('sort') ?? 'priority',
    limit: 200,
  };
  const key = JSON.stringify(filters);

  const meta = useAsync(getMeta, []);
  const issues = useAsync(() => listIssues(filters), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const summary = useAsync(() => getQueueSummary(filters.department || undefined), [filters.department]);

  // Background refresh so new complaints and SLA changes appear without reload.
  useEffect(() => {
    const id = window.setInterval(() => {
      issues.reload(true);
      summary.reload(true);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [issues.reload, summary.reload]); // eslint-disable-line react-hooks/exhaustive-deps

  function setFilter(k: string, v: string) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }

  const points = useMemo(
    () => (issues.data?.items ?? []).map((i) => ({ id: i.id, lat: i.location.lat, lng: i.location.lng, priority: i.priority, reportCount: i.reportCount, summary: i.summary })),
    [issues.data],
  );

  const s = summary.data;
  const activeFilterCount = ['category', 'priority', 'sla', 'q', 'department'].filter((k) => params.get(k)).length + (filters.status !== 'active' ? 1 : 0);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={isAdmin ? 'Administrator' : 'Department queue'}
        title={isAdmin ? filters.department || 'All departments' : `${user?.department}`}
        description="Sorted by AI priority and SLA deadline · refreshes every minute"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              issues.reload(true);
              summary.reload(true);
            }}
          >
            <RefreshCw /> Refresh
          </Button>
        }
      />

      {/* SLA alert */}
      {s && s.breached > 0 && filters.sla !== 'breached' && (
        <button
          type="button"
          onClick={() => setFilter('sla', 'breached')}
          className="group flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-4 py-3 text-left text-sm transition hover:shadow-soft"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <span className="absolute inset-0 animate-ping rounded-xl bg-red-500/40" />
            <AlertTriangle className="relative size-4" />
          </span>
          <span className="text-red-900">
            <strong>
              {s.breached} issue{s.breached > 1 ? 's have' : ' has'} breached SLA.
            </strong>{' '}
            <span className="text-red-800/80">Review them first →</span>
          </span>
        </button>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Inbox} label="Open" value={s?.open} loading={summary.loading} tone="brand" hint="Awaiting action" onClick={() => setFilter('status', 'open')} active={filters.status === 'open'} />
        <StatCard icon={Wrench} label="In progress" value={s?.inProgress} loading={summary.loading} tone="violet" hint="Crews assigned" onClick={() => setFilter('status', 'in_progress')} active={filters.status === 'in_progress'} />
        <StatCard icon={Flame} label="Critical P5" value={s?.critical} loading={summary.loading} tone="red" hint="Danger to life" onClick={() => setFilter('priority', '5')} active={filters.priority === '5'} alert={!!s?.critical} />
        <StatCard icon={Clock} label="SLA at risk" value={s?.atRisk} loading={summary.loading} tone="amber" hint="> 75% of SLA used" onClick={() => setFilter('sla', 'at_risk')} active={filters.sla === 'at_risk'} />
        <StatCard icon={AlertTriangle} label="SLA breached" value={s?.breached} loading={summary.loading} tone="red" hint="Past deadline" onClick={() => setFilter('sla', 'breached')} active={filters.sla === 'breached'} alert={!!s?.breached} />
        <StatCard icon={CheckCircle2} label="Resolved today" value={s?.resolvedToday} loading={summary.loading} tone="emerald" hint="Since midnight" onClick={() => setFilter('status', 'resolved')} active={filters.status === 'resolved'} />
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {STATUS_CHIPS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter('status', c.value === 'active' ? '' : c.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all',
                  filters.status === c.value ? 'bg-white text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <div className="flex flex-wrap gap-1.5">
            {[5, 4, 3, 2, 1].map((p) => {
              const on = filters.priority === String(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilter('priority', on ? '' : String(p))}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-all',
                    on ? PRIORITY_META[p].badge : 'bg-white text-slate-600 ring-border hover:ring-slate-300',
                  )}
                >
                  <span className="size-1.5 rounded-full" style={{ background: PRIORITY_META[p].color }} />P{p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Select value={filters.department} onChange={(e) => setFilter('department', e.target.value)} aria-label="Department">
              <option value="">All departments</option>
              {meta.data?.departments.map((d) => <option key={d}>{d}</option>)}
            </Select>
          )}
          <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {meta.data?.categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select value={filters.sla} onChange={(e) => setFilter('sla', e.target.value)} aria-label="SLA">
            <option value="">Any SLA state</option>
            <option value="on_track">On track</option>
            <option value="at_risk">At risk</option>
            <option value="breached">Breached</option>
          </Select>
          <Select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value === 'priority' ? '' : e.target.value)} aria-label="Sort">
            <option value="priority">Sort: priority</option>
            <option value="sla">Sort: SLA deadline</option>
            <option value="reports">Sort: most reported</option>
            <option value="recent">Sort: most recent</option>
          </Select>
          {filters.q && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-500/20">
              “{filters.q}”
              <button type="button" onClick={() => setFilter('q', '')} className="rounded-full p-0.5 hover:bg-brand-100" aria-label="Clear search">
                <X className="size-3" />
              </button>
            </span>
          )}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              <X /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table + map */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">
              {issues.data ? (
                <>
                  {issues.data.total} <span className="font-normal text-subtle">issue{issues.data.total === 1 ? '' : 's'}</span>
                </>
              ) : (
                <Skeleton className="h-4 w-20" />
              )}
            </p>
            {issues.loading && issues.data && <span className="h-1 w-16 overflow-hidden rounded-full bg-slate-100"><span className="block h-full w-1/2 animate-[shimmer_1s_linear_infinite] bg-brand-500/50" /></span>}
          </div>
          {issues.loading && !issues.data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : issues.error ? (
            <div className="p-4">
              <ErrorState error={issues.error} onRetry={() => issues.reload()} />
            </div>
          ) : issues.data?.items.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={CheckCircle2} title="All clear" description="No issues match these filters. Nice work — or try clearing filters." />
            </div>
          ) : (
            <div className="scrollbar-thin max-h-[calc(100dvh-180px)] overflow-auto">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-subtle">
                    <th className="w-[104px] py-2.5 pl-4 pr-2">Priority</th>
                    <th className="px-2 py-2.5">Issue</th>
                    <th className="w-[136px] px-2 py-2.5">Status · SLA</th>
                    <th className="w-[64px] px-4 py-2.5 text-right">Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issues.data?.items.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      highlighted={hovered === issue.id}
                      onHover={setHovered}
                      showDept={isAdmin && !filters.department}
                      onOpen={() => navigate(`/officer/issue/${issue.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-2 xl:sticky xl:top-24 xl:self-start">
          <IssuesMap points={points} selectedId={hovered} onSelect={(id) => navigate(`/officer/issue/${id}`)} className="h-[420px] xl:h-[calc(100dvh-140px)] xl:max-h-[760px]" />
        </div>
      </div>
    </PageTransition>
  );
}

function IssueRow({ issue, highlighted, onHover, showDept, onOpen }: { issue: Issue; highlighted: boolean; onHover: (id?: string) => void; showDept: boolean; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      onMouseEnter={() => onHover(issue.id)}
      onMouseLeave={() => onHover(undefined)}
      tabIndex={0}
      className={cn(
        'group cursor-pointer outline-none transition-colors hover:bg-brand-50/40 focus-visible:bg-brand-50/60',
        highlighted && 'bg-brand-50/40',
        issue.slaState === 'breached' && 'shadow-[inset_3px_0_0_#dc2626]',
      )}
    >
      <td className="py-3 pl-4 pr-2 align-top">
        <PriorityBadge priority={issue.priority} />
      </td>
      <td className="max-w-0 px-2 py-3">
        <div className="flex min-w-0 gap-3">
          <CategoryIcon category={issue.category} className="mt-0.5 hidden size-8 lg:flex" />
          <div className="min-w-0">
            <p className="line-clamp-2 break-words font-medium leading-snug text-foreground group-hover:text-brand-800">{issue.summary}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle">
              <span>{issue.category}</span>
              {showDept && <span className="font-medium text-slate-600">→ {issue.department}</span>}
              {issue.locationHint && (
                <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{issue.locationHint}</span>
                </span>
              )}
              <span>· {timeAgo(issue.lastReportedAt)}</span>
              {issue.aiFallback && <AiFallbackBadge />}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2 py-3 align-top">
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={issue.status} />
          <SlaBadge state={issue.slaState} dueAt={issue.slaDueAt} />
        </div>
      </td>
      <td className="px-4 py-3 text-right align-top">{issue.reportCount > 1 ? <ReportCountBadge count={issue.reportCount} /> : <span className="text-xs text-subtle">1</span>}</td>
    </tr>
  );
}
