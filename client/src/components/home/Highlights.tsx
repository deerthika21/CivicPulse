import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Clock, GitMerge, Languages, MapPin, Mic, PenLine, Sparkles, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { AiCore } from '@/components/AiCore';
import { PriorityBadge } from '@/components/badges';
import { useI18n, type StringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 6000;

const TABS: { key: StringKey; body: StringKey; icon: LucideIcon; visual: () => ReactNode }[] = [
  { key: 'hlMultilingual', body: 'hlMultilingualBody', icon: Languages, visual: MultilingualVisual },
  { key: 'hlMedia', body: 'hlMediaBody', icon: Camera, visual: MediaVisual },
  { key: 'hlExplainable', body: 'hlExplainableBody', icon: Sparkles, visual: ExplainVisual },
  { key: 'hlDuplicate', body: 'hlDuplicateBody', icon: GitMerge, visual: MergeVisual },
  { key: 'hlSla', body: 'hlSlaBody', icon: Clock, visual: SlaVisual },
];

/** Apple-style tabbed gallery: autoplays until the visitor picks a tab. */
export function Highlights() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!auto || paused || reduce) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % TABS.length), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, auto, paused, reduce]);

  const Visual = TABS[active].visual;

  return (
    <section className="bg-background py-24 sm:py-32" aria-labelledby="hl-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <h2 id="hl-title" className="max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          {t('highlightsTitle')}
        </h2>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-border bg-card shadow-lift">
          <div className="relative h-[620px] sm:h-[440px] lg:h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 grid sm:grid-cols-[0.8fr_1.2fr]"
                id={`hl-panel-${active}`}
                role="tabpanel"
                aria-labelledby={`hl-tab-${active}`}
              >
                <div className="flex flex-col justify-end p-7 sm:justify-center sm:p-12">
                  <h3 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(TABS[active].key)}</h3>
                  <p className="mt-3 max-w-sm text-lg text-muted-foreground">{t(TABS[active].body)}</p>
                </div>
                <div className="relative order-first overflow-hidden bg-gradient-to-br from-brand-50 via-card to-teal-50/70 sm:order-none">
                  <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
                  <div className="relative flex h-full items-center justify-center p-6">
                    <Visual />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div role="tablist" aria-label="Highlights" className="scrollbar-thin flex max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1.5">
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                id={`hl-tab-${i}`}
                role="tab"
                aria-selected={active === i}
                aria-controls={`hl-panel-${i}`}
                onClick={() => {
                  setActive(i);
                  setAuto(false);
                }}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active === i ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <tab.icon className="size-4" />
                {t(tab.key)}
                {active === i && auto && !reduce && (
                  <motion.span
                    key={`p-${active}-${paused}`}
                    className="absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-brand-600"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: paused ? 0 : 1 }}
                    transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- visuals ---------------- */

function Bubble({ lang, children, className }: { lang: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-fit max-w-[260px] rounded-2xl rounded-bl-md border border-border bg-card p-3 shadow-lift', className)}>
      <span className="mb-1 inline-block rounded-full bg-navy-900 px-2 py-0.5 text-[0.625rem] font-bold text-white">{lang}</span>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function MultilingualVisual() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 sm:flex-row">
      <div className="space-y-2">
        <Bubble lang="தமிழ்">குடிநீர் கலங்கலாக வருகிறது</Bubble>
        <Bubble lang="हिन्दी" className="ml-6">पानी गंदा आ रहा है</Bubble>
        <Bubble lang="Tanglish">Thanni romba kalangala varudhu</Bubble>
      </div>
      <AiCore size={56} />
      <div className="rounded-2xl border border-brand-500/30 bg-card p-4 shadow-lift">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-brand-600">English</p>
        <p className="mt-1 text-sm font-semibold">Tap water is muddy.</p>
        <p className="mt-2 text-xs text-subtle">→ Water Board</p>
      </div>
    </div>
  );
}

function MediaVisual() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 sm:flex-row sm:items-end">
      <div className="relative h-48 w-64 overflow-hidden rounded-2xl shadow-lift">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#94a3b8,#475569)]" />
        <div className="absolute bottom-6 left-10 h-14 w-36 rounded-[50%] bg-[radial-gradient(ellipse,#1e293b,#334155_60%,transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[repeating-linear-gradient(90deg,transparent_0_28px,#fde68a55_28px_44px)]" />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white">
          <Camera className="size-3" /> photo
        </span>
      </div>
      <div className="w-64 rounded-2xl border border-border bg-card p-4 shadow-lift">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
          <Mic className="size-3.5" /> 0:14
        </p>
        <div className="mt-3 flex h-10 items-center gap-[3px]">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="w-full rounded-full bg-teal-500" style={{ height: `${25 + Math.abs(Math.sin(i * 1.7)) * 75}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExplainVisual() {
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="gradient-border rounded-2xl p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
            <AiCore size={18} /> Why P5
          </span>
          <PriorityBadge priority={5} />
        </div>
        <p className="mt-3 text-base font-semibold">Exposed live wire on a school route — danger to life.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-brand-600 to-teal-500" />
        </div>
        <p className="mt-1 text-right text-xs font-semibold text-subtle">93% confident</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-3 text-sm shadow-soft">
        <PenLine className="size-4 text-violet-600" /> Officer can override — with a reason.
      </div>
    </div>
  );
}

function MergeVisual() {
  return (
    <div className="flex items-center gap-6">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <MapPin key={i} className="size-7 fill-red-400 text-white opacity-60" strokeWidth={1.5} />
        ))}
      </div>
      <span className="font-display text-3xl text-subtle">→</span>
      <div className="relative">
        <MapPin className="size-16 fill-red-500 text-white drop-shadow-lg" strokeWidth={1.2} />
        <span className="absolute -right-8 -top-1 rounded-full bg-navy-900 px-2.5 py-1 text-sm font-bold text-white shadow-lift">+5</span>
        <p className="mt-2 text-center text-xs font-semibold text-subtle">1 issue</p>
      </div>
    </div>
  );
}

function SlaVisual() {
  const pct = 0.72;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 140 140" className="size-40 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" stroke="#f59e0b" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="space-y-2">
        <p className="font-mono text-3xl font-bold tabular-nums">1h 07m</p>
        <p className="text-sm text-subtle">left on a 4-hour deadline</p>
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">On time</span>
          <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Running late</span>
          <span className="w-fit rounded-full bg-red-600 px-2 py-0.5 text-white">Past deadline</span>
        </div>
      </div>
    </div>
  );
}
