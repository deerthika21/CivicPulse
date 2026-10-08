import { GitMerge, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { StatusBadge } from '@/components/badges';
import { EmptyState, ErrorState } from '@/components/states';
import { Timeline } from '@/components/Timeline';
import { TriageSummary } from '@/components/TriageSummary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CP-XXXXXX" aria-label={t('trackingCode')} />
        <Button type="submit" variant="secondary">
          <Search /> {t('track')}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            icon={Search}
            title={t('notFound')}
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
          <Card className="gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-bold">{data.complaint.trackingCode}</span>
              {data.issue && <StatusBadge status={data.issue.status} ta={lang === 'ta'} />}
            </div>
            <p className="text-xs text-muted-foreground">{formatDateTime(data.complaint.createdAt)}</p>
            {data.issue && data.issue.status !== 'rejected' && <StatusStepper status={data.issue.status} />}
            {data.issue?.resolutionNote && <p className="rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-900">{data.issue.resolutionNote}</p>}
            {data.issue && data.issue.reportCount > 1 && (
              <p className="flex items-center gap-1.5 text-sm text-indigo-800">
                <GitMerge className="size-4" /> {data.issue.reportCount} {t('reports')}
              </p>
            )}
          </Card>

          {data.complaint.isSpam ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('spamNotice')}</p>
          ) : (
            <Card className="p-4">
              <TriageSummary complaint={data.complaint} issue={data.issue} />
            </Card>
          )}

          <Card className="gap-3 p-4">
            <h2 className="text-sm font-semibold">{t('yourComplaint')}</h2>
            {data.complaint.text && <p className="whitespace-pre-wrap text-sm">{data.complaint.text}</p>}
            {data.complaint.language !== 'English' && data.complaint.translation && (
              <div className="rounded-md bg-muted/60 p-2.5">
                <p className="text-[11px] text-muted-foreground">{t('translation')}</p>
                <p className="text-sm">{data.complaint.translation}</p>
              </div>
            )}
            {data.complaint.photoUrl && <img src={mediaUrl(data.complaint.photoUrl)!} alt="" className="max-h-64 w-full rounded-lg object-cover" loading="lazy" />}
            {data.complaint.audioUrl && <audio src={mediaUrl(data.complaint.audioUrl)!} controls className="w-full" />}
          </Card>

          {data.issue && (
            <Card className="gap-3 p-4">
              <h2 className="text-sm font-semibold">{t('progress')}</h2>
              <Timeline entries={data.issue.timeline.filter((e) => e.type !== 'override')} />
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatusStepper({ status }: { status: IssueStatus }) {
  const { lang } = useI18n();
  const current = STEPS.indexOf(status);
  const labels = { en: ['Received', 'In progress', 'Resolved'], ta: ['பெறப்பட்டது', 'நடைபெறுகிறது', 'தீர்க்கப்பட்டது'] }[lang];
  return (
    <div className="flex items-center gap-1" aria-label={`Status: ${labels[current]}`}>
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1">
          <div className={cn('h-1.5 rounded-full', i <= current ? 'bg-primary' : 'bg-muted')} />
          <span className={cn('text-[11px]', i <= current ? 'font-medium text-foreground' : 'text-muted-foreground')}>{label}</span>
        </div>
      ))}
    </div>
  );
}
