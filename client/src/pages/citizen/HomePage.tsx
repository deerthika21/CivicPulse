import { motion } from 'framer-motion';
import { ArrowRight, GitMerge, Megaphone, Search, Sparkles, MessageSquareText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const steps = [
    { icon: MessageSquareText, text: t('step1') },
    { icon: Sparkles, text: t('step2') },
    { icon: GitMerge, text: t('step3') },
  ];

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Megaphone className="size-3.5" /> Chennai
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{t('tagline')}</h1>
        <p className="text-muted-foreground">{t('heroBody')}</p>
        <Button asChild size="lg" className="h-12 w-full text-base">
          <Link to="/report">
            {t('reportIssue')} <ArrowRight />
          </Link>
        </Button>
      </motion.section>

      <Card className="gap-3 p-4">
        <form onSubmit={onTrack} className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            {t('trackComplaint')}
          </label>
          <div className="flex gap-2">
            <Input id="code" placeholder="CP-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
            <Button type="submit" variant="secondary" disabled={!code.trim()}>
              <Search /> {t('track')}
            </Button>
          </div>
        </form>
        {mine.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{t('yourReports')}</p>
            {mine.slice(0, 4).map((r) => (
              <Link key={r.code} to={`/track/${r.code}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-xs font-semibold">{r.code}</span> · {r.summary}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.at)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <section className="grid grid-cols-3 gap-2">
        {stats.loading
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20" />)
          : stats.data &&
            (
              [
                [stats.data.complaints, t('statsComplaints')],
                [stats.data.resolvedIssues, t('statsResolved')],
                [stats.data.duplicatesMerged, t('statsMerged')],
              ] as const
            ).map(([n, label]) => (
              <div key={label} className="rounded-xl border bg-card p-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-primary">{n.toLocaleString('en-IN')}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
              </div>
            ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t('howItWorks')}</h2>
        <ol className="space-y-2">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
