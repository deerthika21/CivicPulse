import { CalendarClock, Check, GitMerge, MapPin, Search, Wrench, Inbox, CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { StatusBadge } from '@/components/badges';
import { PageTransition } from '@/components/motion';
import { EmptyState, ErrorState } from '@/components/states';
import { Timeline } from '@/components/Timeline';
import { TriageSummary } from '@/components/TriageSummary';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input, Skeleton } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { ApiError, mediaUrl, trackComplaint } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { IssueStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS: IssueStatus[] = ['open', 'in_progress', 'resolved'];

export function TrackPage() {
  const { id = '' } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState(id);
  const { data, error, loading, reload } = useAsync(() => (id ? trackComplaint(id) : Promise.resolve(null)), [id]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track/${code.trim().toUpperCase()}`);
  };

  return (
    <PageTransition className="mx-auto max-w-xl space-y-5 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{t('findComplaint')}</h1>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CP-XXXXXX"
            aria-label={t('trackingCode')}
            className="h-12 font-mono text-base tracking-wider"
            autoCapitalize="characters"
          />
          <Button type="submit" size="lg">
            <Search /> <span className="hidden sm:inline">{t('track')}</span>
          </Button>
        </form>
      </div>

      {!id ? (
        <EmptyState icon={Search} title={t('findComplaint')} description={t('findComplaintHint')} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-72" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            icon={Search}
            title={t('notFound')}
            description={t('findComplaintHint')}
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/">{t('back')}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={() => reload()} retryLabel={t('retry')} />
        )
      ) : data ? (
        <>
          {/* status hero */}
          <Card className="gap-5 overflow-hidden p-0">
            <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-brand-50 via-card to-teal-50/60 p-5">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">{t('trackingId')}</p>
                <p className="font-mono text-xl font-bold tracking-[0.1em] text-slate-900">{data.complaint.trackingCode}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                  <CalendarClock className="size-3.5" /> {t('reportedOn')} {formatDateTime(data.complaint.createdAt)}
                </p>
              </div>
              {data.issue && <StatusBadge status={data.issue.status} ta={lang === 'ta'} />}
            </div>
            <div className="space-y-4 px-5 pb-5">
              {data.issue && data.issue.status !== 'rejected' && <StatusStepper status={data.issue.status} />}
              {data.issue?.resolutionNote && (
                <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {data.issue.resolutionNote}
                </p>
              )}
              {data.issue && data.issue.reportCount > 1 && (
                <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-800">
                  <GitMerge className="size-4" /> +{data.issue.reportCount - 1} {t('citizensReported')}
                </p>
              )}
            </div>
          </Card>

          {data.complaint.isSpam ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('spamNotice')}</p>
          ) : (
            <Card className="p-5">
              <TriageSummary complaint={data.complaint} issue={data.issue} />
            </Card>
          )}

          <Card className="gap-3 p-5">
            <CardTitle>{t('yourComplaint')}</CardTitle>
            {data.complaint.text && <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-slate-800">{data.complaint.text}</p>}
            {data.complaint.language !== 'English' && data.complaint.translation && (
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-border">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">{t('translation')}</p>
                <p className="mt-1 text-sm text-slate-700">{data.complaint.translation}</p>
              </div>
            )}
            {data.complaint.photoUrl && <img src={mediaUrl(data.complaint.photoUrl)!} alt="" className="max-h-72 w-full rounded-xl object-cover" loading="lazy" />}
            {data.complaint.audioUrl && <audio src={mediaUrl(data.complaint.audioUrl)!} controls className="w-full" />}
            {(data.complaint.address || data.complaint.locationHint) && (
              <p className="flex items-center gap-1.5 text-xs text-subtle">
                <MapPin className="size-3.5 text-brand-600" /> {data.complaint.address || data.complaint.locationHint}
              </p>
            )}
          </Card>

          {data.issue && (
            <Card className="gap-4 p-5">
              <CardTitle>{t('progress')}</CardTitle>
              <Timeline entries={data.issue.timeline.filter((e) => e.type !== 'override')} />
            </Card>
          )}
        </>
      ) : null}
    </PageTransition>
  );
}

function StatusStepper({ status }: { status: IssueStatus }) {
  const { t } = useI18n();
  const current = STEPS.indexOf(status);
  const labels = [t('stageReceived'), t('stageWorking'), t('stageDone')];
  const icons = [Inbox, Wrench, Check];
  return (
    <ol className="flex items-start" aria-label={`Status: ${labels[current]}`}>
      {labels.map((label, i) => {
        const Icon = icons[i];
        const done = i < current || (i === current && status === 'resolved');
        const active = i === current && status !== 'resolved';
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {i > 0 && <span className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', i <= current ? 'bg-teal-500' : 'bg-slate-200')} />}
            <span
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-full ring-4 ring-card transition-all',
                done && 'bg-teal-brand text-white',
                active && 'bg-brand-gradient text-white shadow-brand',
                !done && !active && 'bg-slate-100 text-slate-400',
              )}
            >
              {active && <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />}
              <Icon className="relative size-4" />
            </span>
            <span className={cn('text-xs leading-tight', i <= current ? 'font-semibold text-foreground' : 'text-subtle')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
