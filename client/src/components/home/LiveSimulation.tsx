import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, Languages, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AiCore } from '@/components/AiCore';
import { PriorityBadge } from '@/components/badges';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/* Sample complaints only — this section never calls the API. */
const SAMPLES = [
  {
    lang: 'Tanglish',
    text: 'Anna Nagar 2nd avenue la periya pallam, nethu bike la vizhunthutten. Yaarum varala!',
    translation: 'Big pothole on 2nd Avenue, Anna Nagar. I fell off my bike yesterday. Nobody has come.',
    category: 'Roads & Potholes',
    department: 'Roads',
    priority: 4,
    reason: 'Already caused a fall — a safety risk to many road users.',
  },
  {
    lang: 'Tamil',
    text: 'பள்ளி அருகே மின் கம்பத்திலிருந்து கம்பி தாழ்வாகத் தொங்குகிறது. காற்றில் தீப்பொறி வருகிறது.',
    translation: 'A wire hangs low from a pole near the school. It sparks in the wind.',
    category: 'Streetlights & Electricity',
    department: 'Electrical',
    priority: 5,
    reason: 'Exposed live wire on a school route — danger to life.',
  },
  {
    lang: 'English',
    text: 'Garbage not collected on our street for 5 days. Bins overflowing, dogs spreading it everywhere.',
    translation: 'Garbage not collected on our street for 5 days. Bins overflowing, dogs spreading it everywhere.',
    category: 'Garbage & Sanitation',
    department: 'Solid Waste Mgmt',
    priority: 3,
    reason: 'Hygiene risk on a residential street; significant inconvenience.',
  },
];

const FIELDS = 5;

export function LiveSimulation() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = SAMPLES[idx];

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // type → reveal fields → hold → next sample
  useEffect(() => {
    if (!visible) return;
    if (reduce) {
      setTyped(s.text.length);
      setRevealed(FIELDS);
      const id = setTimeout(() => setIdx((i) => (i + 1) % SAMPLES.length), 6000);
      return () => clearTimeout(id);
    }
    if (typed < s.text.length) {
      const id = setTimeout(() => setTyped((n) => Math.min(s.text.length, n + 2)), 26);
      return () => clearTimeout(id);
    }
    if (revealed < FIELDS) {
      const id = setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? 550 : 420);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setIdx((i) => (i + 1) % SAMPLES.length);
      setTyped(0);
      setRevealed(0);
    }, 3200);
    return () => clearTimeout(id);
  }, [visible, typed, revealed, s.text.length, reduce]);

  const rows = [
    { icon: Languages, label: t('fieldLanguage'), value: s.lang },
    { icon: null, label: t('fieldTranslation'), value: s.translation },
    { icon: Tag, label: t('fieldCategory'), value: s.category },
    { icon: Building2, label: t('fieldDepartment'), value: s.department },
  ];

  return (
    <section className="theme-light relative overflow-hidden bg-navy-hero py-24 text-white sm:py-32" aria-labelledby="sim-title">
      <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-teal-200">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-teal-400" />
            </span>
            {t('simBadge')}
          </span>
          <h2 id="sim-title" className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {t('simTitle')}
          </h2>
          <p className="mt-5 max-w-md text-lg text-slate-300">{t('simBody')}</p>
          <Button asChild size="xl" variant="glass" className="mt-8">
            <Link to="/report">
              {t('tryIt')} <ArrowRight />
            </Link>
          </Button>
          <p className="mt-4 text-xs text-slate-400">{t('simDisclaimer')}</p>
        </div>

        <div ref={ref} className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7" aria-live="off">
          {/* complaint being typed */}
          <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-lift">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Citizen · {idx + 1}/3</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-slate-600">{t('simBadge')}</span>
            </div>
            <p className="min-h-[3.5rem] text-[0.9375rem] font-medium leading-relaxed">
              {s.text.slice(0, typed)}
              {typed < s.text.length && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-brand-600" />}
            </p>
          </div>

          <div className="my-5 flex items-center gap-3">
            <AiCore size={36} />
            <span className="h-px flex-1 bg-gradient-to-r from-brand-400/60 to-transparent" />
          </div>

          {/* triage, field by field */}
          <dl className="grid min-h-[330px] content-start gap-2.5 sm:min-h-[250px] sm:grid-cols-2">
            {rows.map((r, i) => (
              <AnimatePresence key={`${idx}-${r.label}`}>
                {revealed > i && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={i === 1 ? 'sm:col-span-2' : undefined}
                  >
                    <div className="h-full rounded-xl border border-white/10 bg-white/[0.06] p-3">
                      <dt className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">
                        {r.icon && <r.icon className="size-3.5 text-teal-300" />} {r.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-white">{r.value}</dd>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
            <AnimatePresence>
              {revealed >= FIELDS && (
                <motion.div key={`${idx}-p`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="sm:col-span-2">
                  <div className="rounded-xl border border-gold/40 bg-gold/10 p-3.5">
                    <dt className="flex items-center justify-between">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gold-soft">{t('fieldPriority')}</span>
                      <PriorityBadge priority={s.priority} />
                    </dt>
                    <dd className="mt-1.5 text-sm text-slate-100">{s.reason}</dd>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </dl>
        </div>
      </div>
    </section>
  );
}
