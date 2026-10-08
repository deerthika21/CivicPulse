import { AlertTriangle, CheckCircle2, Clock, Flame, Inbox, Loader2, RefreshCw, Search, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AiFallbackBadge, CategoryLabel, PriorityBadge, ReportCountBadge, SlaBadge, StatusBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { getMeta, getQueueSummary, listIssues } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import type { Issue } from '@/lib/types';
import { cn } from '@/lib/utils';

const REFRESH_MS = 60_000;

export function OfficerQueuePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hovered, setHovered] = useState<string>();
  const [search, setSearch] = useState(params.get('q') ?? '');

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

  // Debounced search box → URL
  useEffect(() => {
    const id = setTimeout(() => setFilter('q', search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const tiles = [
    { label: 'Open', value: s?.open, icon: Inbox, tone: 'text-sky-700 bg-sky-50', onClick: () => setFilter('status', 'open') },
    { label: 'In progress', value: s?.inProgress, icon: Wrench, tone: 'text-violet-700 bg-violet-50', onClick: () => setFilter('status', 'in_progress') },
    { label: 'Critical (P5)', value: s?.critical, icon: Flame, tone: 'text-red-700 bg-red-50', onClick: () => setFilter('priority', '5') },
    { label: 'SLA at risk', value: s?.atRisk, icon: Clock, tone: 'text-amber-700 bg-amber-50', onClick: () => setFilter('sla', 'at_risk') },
    { label: 'SLA breached', value: s?.breached, icon: AlertTriangle, tone: 'text-red-700 bg-red-50', onClick: () => setFilter('sla', 'breached') },
    { label: 'Resolved today', value: s?.resolvedToday, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50', onClick: () => setFilter('status', 'resolved') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? (filters.department || 'All departments') : `${user?.department} queue`}</h1>
          <p className="text-sm text-muted-foreground">Sorted by AI priority and SLA deadline · auto-refreshes every minute</p>
        </div>
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
      </div>

      {/* SLA alert banner */}
      {s && s.breached > 0 && filters.sla !== 'breached' && (
        <button
          type="button"
          onClick={() => setFilter('sla', 'breached')}
          className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-left text-sm text-red-900 hover:bg-red-100"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            <strong>{s.breached} issue{s.breached > 1 ? 's have' : ' has'} breached SLA.</strong> Click to view them first.
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map(({ label, value, icon: Icon, tone, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:shadow-sm">
            <span className={cn('flex size-9 items-center justify-center rounded-lg', tone)}>
              <Icon className="size-4" />
            </span>
            <span>
              {summary.loading ? <Skeleton className="h-6 w-8" /> : <span className="block text-xl font-bold tabular-nums">{value ?? '–'}</span>}
              <span className="block text-xs text-muted-foreground">{label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Filters: one row */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search summary or area…" className="h-9 pl-8" />
        </div>
        {isAdmin && (
          <Select value={filters.department} onChange={(e) => setFilter('department', e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {meta.data?.departments.map((d) => <option key={d}>{d}</option>)}
          </Select>
        )}
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value === 'active' ? '' : e.target.value)} aria-label="Status">
          <option value="active">Active</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Closed</option>
          <option value="all">All</option>
        </Select>
        <Select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Priority">
          <option value="">Any priority</option>
          {[5, 4, 3, 2, 1].map((p) => (
            <option key={p} value={p}>
              P{p}
            </option>
          ))}
        </Select>
        <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {meta.data?.categories.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={filters.sla} onChange={(e) => setFilter('sla', e.target.value)} aria-label="SLA">
          <option value="">Any SLA</option>
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
        {[...params.keys()].length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <section className="min-w-0 space-y-2">
          <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            {issues.data ? `${issues.data.total} issue${issues.data.total === 1 ? '' : 's'}` : ' '}
            {issues.loading && issues.data && <Loader2 className="size-3 animate-spin" />}
          </p>
          {issues.loading && !issues.data ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)
          ) : issues.error ? (
            <ErrorState error={issues.error} onRetry={() => issues.reload()} />
          ) : issues.data?.items.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing here" description="No issues match these filters. Nice work — or try clearing filters." />
          ) : (
            issues.data?.items.map((issue) => (
              <IssueRow key={issue.id} issue={issue} highlighted={hovered === issue.id} onHover={setHovered} showDept={isAdmin && !filters.department} />
            ))
          )}
        </section>
        <IssuesMap points={points} selectedId={hovered} onSelect={(id) => navigate(`/officer/issue/${id}`)} className="h-[420px] xl:sticky xl:top-6 xl:h-[calc(100dvh-3rem)]" />
      </div>
    </div>
  );
}

function IssueRow({ issue, highlighted, onHover, showDept }: { issue: Issue; highlighted: boolean; onHover: (id?: string) => void; showDept: boolean }) {
  return (
    <Link
      to={`/officer/issue/${issue.id}`}
      onMouseEnter={() => onHover(issue.id)}
      onMouseLeave={() => onHover(undefined)}
      className={cn(
        'block rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm',
        highlighted && 'border-primary/50 shadow-sm',
        issue.slaState === 'breached' && 'border-l-4 border-l-red-500',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={issue.priority} />
        <StatusBadge status={issue.status} />
        <SlaBadge state={issue.slaState} dueAt={issue.slaDueAt} />
        <ReportCountBadge count={issue.reportCount} />
        {issue.aiFallback && <AiFallbackBadge />}
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(issue.lastReportedAt)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{issue.summary}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <CategoryLabel category={issue.category} />
        {showDept && <span>→ {issue.department}</span>}
        {issue.locationHint && <span className="truncate">📍 {issue.locationHint}</span>}
      </div>
    </Link>
  );
}
