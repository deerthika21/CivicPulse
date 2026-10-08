import { ArrowLeft, CalendarClock, CheckCircle2, GitMerge, Images, Loader2, MapPin, MessageSquareText, PenLine, Phone, Play, RotateCcw, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { AiCore } from '@/components/AiCore';
import { AiFallbackBadge, CategoryIcon, PriorityBadge, ReportCountBadge, SlaBadge, StatusBadge } from '@/components/badges';
import { IssuesMap } from '@/components/maps/IssuesMap';
import { PageTransition, Stagger, StaggerItem } from '@/components/motion';
import { ErrorState } from '@/components/states';
import { Timeline } from '@/components/Timeline';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Badge, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { ApiError, getIssue, getMeta, mediaUrl, updateIssue } from '@/lib/api';
import { formatDateTime, hours, timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { Complaint, IssueDetail, IssueStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function OfficerIssuePage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const detail = useAsync(() => getIssue(id), [id]);

  return (
    <PageTransition className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/officer">
          <ArrowLeft /> {t('backToQueue')}
        </Link>
      </Button>
      {detail.loading && !detail.data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : detail.error ? (
        <ErrorState error={detail.error instanceof ApiError && detail.error.status === 403 ? new Error(t('wrongDept')) : detail.error} onRetry={() => detail.reload()} retryLabel={t('retry')} />
      ) : detail.data ? (
        <IssueView data={detail.data} onChange={detail.setData} />
      ) : null}
    </PageTransition>
  );
}

function IssueView({ data, onChange }: { data: IssueDetail; onChange: (d: IssueDetail) => void }) {
  const { t } = useI18n();
  const { issue, complaints } = data;
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const active = issue.status === 'open' || issue.status === 'in_progress';
  const photos = complaints.filter((c) => c.photoUrl);

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

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* ---------------- left ---------------- */}
      <div className="min-w-0 space-y-5">
        <Card className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={issue.priority} size="lg" />
            <StatusBadge status={issue.status} />
            <SlaBadge state={issue.slaState} dueAt={issue.slaDueAt} />
            <ReportCountBadge count={issue.reportCount} />
            {issue.aiFallback && <AiFallbackBadge />}
          </div>
          <h1 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground">{issue.summary}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CategoryIcon category={issue.category} className="size-7 rounded-lg" /> {issue.category} <span className="text-subtle">→</span> <span className="font-semibold text-foreground">{issue.department}</span>
            </span>
            {issue.locationHint && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-brand-600" /> {issue.locationHint}
              </span>
            )}
          </div>
          <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-inset ring-border sm:grid-cols-3">
            <Meta label={t('firstReported')} value={formatDateTime(issue.createdAt)} />
            <Meta label={t('timeAllowed')} value={hours(issue.slaHours)} />
            <Meta label={t('due')} value={formatDateTime(issue.slaDueAt)} danger={issue.slaState === 'breached'} />
          </div>
          {issue.resolutionNote && (
            <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {issue.resolutionNote}
            </p>
          )}
        </Card>

        {photos.length > 0 && (
          <Card className="gap-3">
            <CardTitle className="flex items-center gap-2">
              <Images className="size-4 text-brand-600" /> {t('photos')} <span className="font-normal text-subtle">({photos.length})</span>
            </CardTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((c, i) => (
                <a
                  key={c.id}
                  href={mediaUrl(c.photoUrl)!}
                  target="_blank"
                  rel="noreferrer"
                  className={cn('group relative overflow-hidden rounded-xl border border-border', i === 0 && photos.length > 2 && 'col-span-2 row-span-2')}
                >
                  <img src={mediaUrl(c.photoUrl)!} alt={`Photo from ${c.trackingCode}`} className="aspect-[4/3] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-900/70 px-1.5 py-0.5 font-mono text-[0.625rem] text-white">{c.trackingCode}</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* the AI's call */}
        <div className="gradient-border relative overflow-hidden rounded-2xl p-6 shadow-soft">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-500/10 blur-3xl" />
          <CardHeader>
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
                <AiCore size={20} /> {t('aiAssessment')}
              </p>
              <p className="mt-2 text-[0.9375rem] font-medium leading-relaxed text-foreground">
                <span className="font-display font-bold">
                  {t('whyPriority')} P{issue.priority}:{' '}
                </span>
                {issue.priorityReason}
              </p>
            </div>
          </CardHeader>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Field label={t('category')} value={issue.category} locked={issue.lockedFields.includes('category')} />
            <Field label={t('department')} value={issue.department} locked={issue.lockedFields.includes('department')} />
            <Field label={t('fieldPriority')} value={`P${issue.priority}`} locked={issue.lockedFields.includes('priority')} />
          </div>
          <div className="mt-4">
            <ConfidenceBar value={issue.confidence} />
          </div>
          {issue.overrides.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">{t('changeLog')}</p>
              {issue.overrides.map((o, i) => (
                <p key={i} className="flex gap-2 text-xs text-slate-700">
                  <PenLine className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
                  <span>
                    <strong className="capitalize">{o.field}</strong> {String(o.from)} → {String(o.to)} — “{o.reason}” <span className="text-subtle">· {o.byName}, {timeAgo(o.at)}</span>
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* reports as chat */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <MessageSquareText className="size-4 text-brand-600" />
            {complaints.length > 1 ? `${complaints.length} ${t('reportsMerged')}` : t('oneReport')}
          </h2>
          <Stagger className="space-y-3" step={0.04}>
            {complaints.map((c, i) => (
              <StaggerItem key={c.id}>
                <ComplaintBubble c={c} index={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </div>

      {/* ---------------- right: sticky action panel ---------------- */}
      <aside className="space-y-5 lg:sticky lg:top-24">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>{t('takeAction')}</CardTitle>
            <StatusBadge status={issue.status} />
          </CardHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('notePlaceholder')} className="min-h-24" maxLength={1000} aria-label={t('notePlaceholder')} />
          <div className="grid gap-2">
            {issue.status === 'open' && (
              <Button size="lg" onClick={() => setStatus('in_progress', t('toastStarted'))} disabled={!!saving}>
                {saving === t('toastStarted') ? <Loader2 className="animate-spin" /> : <Play />} {t('startWork')}
              </Button>
            )}
            {active && (
              <Button size="lg" variant={issue.status === 'open' ? 'outline' : 'teal'} onClick={() => setStatus('resolved', t('toastFixed'))} disabled={!!saving}>
                {saving === t('toastFixed') ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t('markFixed')}
              </Button>
            )}
            {active && (
              <Button variant="ghost" onClick={() => setStatus('rejected', t('toastClosed'))} disabled={!!saving}>
                <XCircle /> {t('closeNotActionable')}
              </Button>
            )}
            {!active && (
              <Button variant="outline" size="lg" onClick={() => setStatus('open', t('toastReopened'))} disabled={!!saving}>
                <RotateCcw /> {t('reopen')}
              </Button>
            )}
            {note.trim() && (
              <Button variant="secondary" size="sm" onClick={() => act({ note: note.trim() }, t('toastNote'))} disabled={!!saving}>
                {t('addNoteOnly')}
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/50 p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AiCore size={18} /> {t('disagreeTitle')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t('disagreeBody')}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setOverrideOpen(true)}>
              <PenLine /> {t('override')}
            </Button>
          </div>
        </Card>

        <IssuesMap
          points={[{ id: issue.id, lat: issue.location.lat, lng: issue.location.lng, priority: issue.priority, reportCount: issue.reportCount, summary: issue.summary }]}
          className="h-56"
        />

        <Card className="gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-brand-600" /> {t('timeline')}
          </CardTitle>
          <div className="scrollbar-thin max-h-[420px] overflow-auto pr-1">
            <Timeline entries={issue.timeline} />
          </div>
        </Card>
      </aside>

      <OverrideDialog key={issue.updatedAt} open={overrideOpen} onOpenChange={setOverrideOpen} data={data} onSaved={onChange} />
    </div>
  );
}

function Meta({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-subtle">{label}</p>
      <p className={cn('mt-0.5 font-semibold', danger ? 'text-red-600' : 'text-foreground')}>{value}</p>
    </div>
  );
}

function Field({ label, value, locked }: { label: string; value: string; locked: boolean }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-inset ring-border">
      <p className="flex items-center justify-between gap-2 text-[0.6875rem] font-medium text-subtle">
        {label} {locked && <Badge className="bg-violet-50 px-1.5 py-0 text-[0.625rem] text-violet-700 ring-violet-500/20">{t('officerSet')}</Badge>}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const { t } = useI18n();
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 font-medium text-subtle">{t('confidence')}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('confidence')}>
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-teal-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-bold tabular-nums">{pct}%</span>
    </div>
  );
}

const AVATAR_TONES = ['from-[#6366f1] to-[#3730a3]', 'from-teal-400 to-teal-600', 'from-amber-400 to-orange-500', 'from-pink-400 to-rose-600', 'from-sky-400 to-sky-600'];

function ComplaintBubble({ c, index }: { c: Complaint; index: number }) {
  const { t } = useI18n();
  const name = c.citizen?.name || 'Citizen';
  return (
    <div className="flex gap-3">
      <span className={cn('mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm', AVATAR_TONES[index % AVATAR_TONES.length])}>
        {name === 'Citizen' ? <User className="size-4" /> : name[0].toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-foreground">{name}</span>
          <span className="font-mono text-subtle">{c.trackingCode}</span>
          <span className="text-subtle">· {formatDateTime(c.createdAt)}</span>
          {c.mergedAsDuplicate && c.duplicateSimilarity != null && (
            <Badge className="bg-brand-50 font-semibold text-brand-800 ring-brand-500/20" title={`Matched via ${c.duplicateMethod?.replace('_', ' ')}`}>
              <GitMerge className="size-3" /> {Math.round(c.duplicateSimilarity * 100)}% {t('similar')} · {c.duplicateDistanceM} m
            </Badge>
          )}
        </div>
        <div className="rounded-2xl rounded-tl-md border border-border bg-card p-4 shadow-soft">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge className="bg-navy-900 text-white ring-navy-900">{c.language}</Badge>
            <Badge className="capitalize">{c.sentiment}</Badge>
          </div>
          {c.text && <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-slate-800">{c.text}</p>}
          {c.transcript && (
            <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-sm text-slate-700 ring-1 ring-inset ring-border">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">{t('voiceTranscript')} · </span>
              {c.transcript}
            </p>
          )}
          {c.language !== 'English' && c.translation && (
            <div className="mt-3 border-l-2 border-teal-500 pl-3">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-teal-700">{t('translation')}</p>
              <p className="mt-0.5 text-sm text-slate-700">{c.translation}</p>
            </div>
          )}
          {c.audioUrl && <audio src={mediaUrl(c.audioUrl)!} controls className="mt-3 h-10 w-full" />}
          {c.citizen?.phone && (
            <a href={`tel:${c.citizen.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline">
              <Phone className="size-3" /> {c.citizen.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function OverrideDialog({ open, onOpenChange, data, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; data: IssueDetail; onSaved: (d: IssueDetail) => void }) {
  const { t } = useI18n();
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
    if (reason.trim().length < 3) return setError(t('reasonRequired'));
    setSaving(true);
    try {
      const body: Record<string, unknown> = { reason: reason.trim() };
      if (category !== issue.category) body.category = category;
      if (department !== issue.department) body.department = department;
      if (priority !== issue.priority) body.priority = priority;
      onSaved(await updateIssue(issue.id, body));
      toast.success(t('toastOverride'));
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
      <DialogContent className="rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-navy-900">
            <AiCore size={26} />
          </span>
          <div>
            <DialogTitle className="font-display">{t('overrideTitle')}</DialogTitle>
            <DialogDescription>{t('overrideSub')}</DialogDescription>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>{t('category')}</Label>
            <Select value={category} onChange={(e) => onCategory(e.target.value)} className="h-11 w-full">
              {(meta.data?.categories ?? [issue.category]).map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('department')}</Label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 w-full">
              {(meta.data?.departments ?? [issue.department]).map((d) => <option key={d}>{d}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('fieldPriority')}</Label>
            <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="h-11 w-full">
              {[5, 4, 3, 2, 1].map((p) => (
                <option key={p} value={p}>
                  P{p} — {meta.data?.priorityRubric[p] ?? ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">{t('reason')}</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('reasonPlaceholder')} className="min-h-24" />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={save} disabled={!changed || saving}>
            {saving && <Loader2 className="animate-spin" />} {t('saveOverride')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
