import { ArrowLeft, CheckCircle2, GitMerge, Loader2, MapPin, PenLine, Phone, Play, Sparkles, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { AiFallbackBadge, CategoryLabel, PriorityBadge, ReportCountBadge, SlaBadge, StatusBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { ErrorState } from '@/components/states';
import { Timeline } from '@/components/Timeline';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Badge, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { ApiError, getIssue, getMeta, mediaUrl, updateIssue } from '@/lib/api';
import { formatDateTime, hours, timeAgo } from '@/lib/format';
import type { Complaint, IssueDetail, IssueStatus } from '@/lib/types';

export function OfficerIssuePage() {
  const { id = '' } = useParams();
  const detail = useAsync(() => getIssue(id), [id]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/officer">
          <ArrowLeft /> Back to queue
        </Link>
      </Button>
      {detail.loading && !detail.data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : detail.error ? (
        <ErrorState
          error={detail.error instanceof ApiError && detail.error.status === 403 ? new Error('This issue belongs to another department.') : detail.error}
          onRetry={() => detail.reload()}
        />
      ) : detail.data ? (
        <IssueView data={detail.data} onChange={detail.setData} />
      ) : null}
    </div>
  );
}

function IssueView({ data, onChange }: { data: IssueDetail; onChange: (d: IssueDetail) => void }) {
  const { issue, complaints } = data;
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const active = issue.status === 'open' || issue.status === 'in_progress';

  const act = async (body: Record<string, unknown>, label: string) => {
    setSaving(label);
    try {
      const next = await updateIssue(issue.id, body);
      onChange(next);
      setNote('');
      toast.success(label);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const setStatus = (status: IssueStatus, label: string) => act({ status, ...(note.trim() ? { note: note.trim() } : {}) }, label);
  const first = complaints[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {/* Header */}
        <Card className="gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
            <SlaBadge state={issue.slaState} dueAt={issue.slaDueAt} />
            <ReportCountBadge count={issue.reportCount} />
            {issue.aiFallback && <AiFallbackBadge />}
          </div>
          <h1 className="text-xl font-bold leading-snug">{issue.summary}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <CategoryLabel category={issue.category} />
            <span>→ {issue.department}</span>
            {issue.locationHint && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {issue.locationHint}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            First reported {formatDateTime(issue.createdAt)} · SLA {hours(issue.slaHours)} · due {formatDateTime(issue.slaDueAt)}
          </p>
          {issue.resolutionNote && <p className="rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-900">Resolution: {issue.resolutionNote}</p>}
        </Card>

        {/* AI reasoning */}
        <Card className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> AI triage
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setOverrideOpen(true)}>
              <PenLine /> Override
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Category" value={issue.category} locked={issue.lockedFields.includes('category')} />
            <Field label="Department" value={issue.department} locked={issue.lockedFields.includes('department')} />
            <Field label="Priority" value={`P${issue.priority}`} locked={issue.lockedFields.includes('priority')} />
          </div>
          <p className="rounded-md bg-muted/60 p-3 text-sm">
            <span className="font-medium">Why P{issue.priority}: </span>
            {issue.priorityReason}
          </p>
          <ConfidenceBar value={issue.confidence} />
          {issue.overrides.length > 0 && (
            <div className="space-y-1 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Override audit log</p>
              {issue.overrides.map((o, i) => (
                <p key={i} className="text-xs">
                  <strong>{o.field}</strong>: {String(o.from)} → {String(o.to)} — “{o.reason}” · {o.byName}, {timeAgo(o.at)}
                </p>
              ))}
            </div>
          )}
        </Card>

        {/* Reports */}
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 px-1 text-sm font-semibold">
            <GitMerge className="size-4" /> {complaints.length} citizen report{complaints.length === 1 ? '' : 's'}
          </h2>
          {complaints.map((c) => (
            <ComplaintCard key={c.id} c={c} />
          ))}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <Card className="gap-3">
          <CardTitle>Update status</CardTitle>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the citizen / audit log (optional)" className="min-h-20" maxLength={1000} />
          <div className="grid gap-2">
            {issue.status === 'open' && (
              <Button onClick={() => setStatus('in_progress', 'Marked in progress')} disabled={!!saving}>
                {saving === 'Marked in progress' ? <Loader2 className="animate-spin" /> : <Play />} Start work
              </Button>
            )}
            {active && (
              <Button variant={issue.status === 'open' ? 'outline' : 'default'} onClick={() => setStatus('resolved', 'Marked resolved')} disabled={!!saving}>
                {saving === 'Marked resolved' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Mark resolved
              </Button>
            )}
            {active && (
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setStatus('rejected', 'Closed')} disabled={!!saving}>
                <XCircle /> Close (not actionable)
              </Button>
            )}
            {!active && (
              <Button variant="outline" onClick={() => setStatus('open', 'Reopened')} disabled={!!saving}>
                Reopen
              </Button>
            )}
            {note.trim() && (
              <Button variant="secondary" size="sm" onClick={() => act({ note: note.trim() }, 'Note added')} disabled={!!saving}>
                Add note only
              </Button>
            )}
          </div>
        </Card>

        {first && (
          <IssuesMap
            points={[{ id: issue.id, lat: issue.location.lat, lng: issue.location.lng, priority: issue.priority, reportCount: issue.reportCount, summary: issue.summary }]}
            className="h-56"
          />
        )}

        <Card className="gap-3">
          <CardTitle>Timeline</CardTitle>
          <Timeline entries={issue.timeline} />
        </Card>
      </aside>

      <OverrideDialog key={issue.updatedAt} open={overrideOpen} onOpenChange={setOverrideOpen} data={data} onSaved={onChange} />
    </div>
  );
}

function Field({ label, value, locked }: { label: string; value: string; locked: boolean }) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="flex items-center justify-between text-[11px] text-muted-foreground">
        {label} {locked && <Badge className="border-violet-200 bg-violet-50 px-1.5 text-[10px] text-violet-800">officer set</Badge>}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 text-muted-foreground">AI confidence</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right font-medium tabular-nums">{pct}%</span>
    </div>
  );
}

function ComplaintCard({ c }: { c: Complaint }) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-mono font-semibold">{c.trackingCode}</span>
        <Badge className="bg-muted">{c.language}</Badge>
        <Badge className="bg-muted capitalize">{c.sentiment}</Badge>
        {c.mergedAsDuplicate && c.duplicateSimilarity != null && (
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-800" title={`Matched via ${c.duplicateMethod?.replace('_', ' ')}`}>
            <GitMerge className="size-3" /> {Math.round(c.duplicateSimilarity * 100)}% similar · {c.duplicateDistanceM} m
          </Badge>
        )}
        <span className="ml-auto text-muted-foreground">{formatDateTime(c.createdAt)}</span>
      </div>
      {c.text && <p className="whitespace-pre-wrap text-sm">{c.text}</p>}
      {c.transcript && (
        <p className="rounded-md bg-muted/60 p-2 text-sm">
          <span className="text-xs text-muted-foreground">Voice transcript: </span>
          {c.transcript}
        </p>
      )}
      {c.language !== 'English' && c.translation && (
        <p className="rounded-md bg-accent/50 p-2 text-sm">
          <span className="text-xs text-muted-foreground">Translation: </span>
          {c.translation}
        </p>
      )}
      {(c.photoUrl || c.audioUrl) && (
        <div className="flex flex-wrap items-start gap-2">
          {c.photoUrl && (
            <a href={mediaUrl(c.photoUrl)!} target="_blank" rel="noreferrer">
              <img src={mediaUrl(c.photoUrl)!} alt="Complaint photo" className="h-32 rounded-lg border object-cover" loading="lazy" />
            </a>
          )}
          {c.audioUrl && <audio src={mediaUrl(c.audioUrl)!} controls className="h-10" />}
        </div>
      )}
      {(c.citizen?.name || c.citizen?.phone) && (
        <p className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {c.citizen.name && (
            <span className="flex items-center gap-1">
              <User className="size-3" /> {c.citizen.name}
            </span>
          )}
          {c.citizen.phone && (
            <a href={`tel:${c.citizen.phone}`} className="flex items-center gap-1 hover:underline">
              <Phone className="size-3" /> {c.citizen.phone}
            </a>
          )}
        </p>
      )}
    </Card>
  );
}

function OverrideDialog({
  open,
  onOpenChange,
  data,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: IssueDetail;
  onSaved: (d: IssueDetail) => void;
}) {
  const { issue } = data;
  const meta = useAsync(getMeta, []);
  const [category, setCategory] = useState(issue.category);
  const [department, setDepartment] = useState(issue.department);
  const [priority, setPriority] = useState(issue.priority);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changed = category !== issue.category || department !== issue.department || priority !== issue.priority;

  const onCategory = (c: string) => {
    setCategory(c);
    const mapped = meta.data?.categoryToDepartment[c];
    if (mapped) setDepartment(mapped);
  };

  const save = async () => {
    setError('');
    if (reason.trim().length < 3) return setError('Please give a reason (it is recorded in the audit log).');
    setSaving(true);
    try {
      const body: Record<string, unknown> = { reason: reason.trim() };
      if (category !== issue.category) body.category = category;
      if (department !== issue.department) body.department = department;
      if (priority !== issue.priority) body.priority = priority;
      onSaved(await updateIssue(issue.id, body));
      toast.success('AI decision overridden');
      setReason('');
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Override AI decision</DialogTitle>
        <DialogDescription>Changes are locked against future AI updates and recorded in the audit log.</DialogDescription>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onChange={(e) => onCategory(e.target.value)} className="w-full">
              {(meta.data?.categories ?? [issue.category]).map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full">
              {(meta.data?.departments ?? [issue.department]).map((d) => <option key={d}>{d}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full">
              {[5, 4, 3, 2, 1].map((p) => (
                <option key={p} value={p}>
                  P{p} — {meta.data?.priorityRubric[p] ?? ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Site inspection shows exposed cable — danger to life" className="min-h-20" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!changed || saving}>
            {saving && <Loader2 className="animate-spin" />} Save override
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
