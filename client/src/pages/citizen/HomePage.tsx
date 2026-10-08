import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { SceneSlot } from '@/components/three/SceneSlot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/primitives';
import { timeAgo } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { getMyReports } from '@/lib/myReports';

const BelowFold = lazy(() => import('@/components/home/BelowFold'));

const EASE = [0.22, 1, 0.36, 1] as const;

export function HomePage() {
  const { t } = useI18n();

  return (
    <div>
      {/* ---------------- Hero (dark navy, 3D behind) ---------------- */}
      <section className="theme-light relative isolate flex min-h-[640px] flex-col overflow-hidden bg-navy-hero text-white [height:calc(100svh-6.5rem)] lg:max-h-[960px]">
        <SceneSlot variant="hero" className="absolute inset-0 -z-10 h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-navy-950/90" />
        <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-[60%] bg-gradient-to-r from-navy-950/85 via-navy-950/50 to-transparent lg:block" />

        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-5 pt-14 text-center sm:px-6 sm:pt-20 lg:items-start lg:pt-24 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-gold-soft backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-gold" /> {t('heroEyebrow')}
          </motion.p>
          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.75rem]">
            {(['heroTitle1', 'heroTitle2', 'heroTitle3'] as const).map((k, i) => (
              <motion.span
                key={k}
                className={i === 2 ? 'block text-gold-gradient' : 'block'}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: EASE }}
              >
                {t(k)}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl"
          >
            {t('heroBody')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65, ease: EASE }}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button asChild size="xl" className="bg-white bg-none text-navy-950 shadow-none hover:bg-slate-100 hover:shadow-none">
              <Link to="/report">
                {t('reportIssue')} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <Link to="/track">
                <Search /> {t('trackComplaint')}
              </Link>
            </Button>
          </motion.div>
        </div>
        <a href="#story" className="mx-auto mb-6 mt-auto flex flex-col items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-white">
          {t('scrollHint')}
          <ChevronDown className="size-4 animate-bounce" />
        </a>
      </section>

      <Suspense fallback={<div className="min-h-[100svh]" aria-hidden />}>
        <BelowFold />
      </Suspense>
      <TrackBand />
    </div>
  );
}

/** "Already reported?" — tracking box plus this device's recent reports. */
function TrackBand() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const mine = getMyReports();
  const onTrack = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track/${code.trim().toUpperCase()}`);
  };
  return (
    <section className="border-t border-border bg-muted/40 py-16" aria-labelledby="track-title">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-5 sm:px-6 md:grid-cols-2 md:items-center">
        <form onSubmit={onTrack} className="space-y-3">
          <h2 id="track-title" className="font-display text-3xl font-bold tracking-tight">
            {t('findComplaint')}
          </h2>
          <p className="text-muted-foreground">{t('findComplaintHint')}</p>
          <div className="flex max-w-md gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CP-XXXXXX" aria-label={t('trackingId')} autoCapitalize="characters" className="h-12 font-mono tracking-wider" />
            <Button type="submit" size="lg" disabled={!code.trim()}>
              <Search /> {t('track')}
            </Button>
          </div>
        </form>
        {mine.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{t('yourReports')}</p>
            {mine.slice(0, 3).map((r) => (
              <Link key={r.code} to={`/track/${r.code}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-brand-500/40">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-xs font-bold text-brand-800">{r.code}</span>
                  <span className="text-muted-foreground"> · {r.summary}</span>
                </span>
                <span className="shrink-0 text-xs text-subtle">{timeAgo(r.at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
