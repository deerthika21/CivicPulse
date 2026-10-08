import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Building2, Clock, Construction, MapPin } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { AiCore } from '@/components/AiCore';
import { useI18n, type StringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const STAGES: { title: StringKey; body: StringKey }[] = [
  { title: 'story1', body: 'story1Body' },
  { title: 'story2', body: 'story2Body' },
  { title: 'story3', body: 'story3Body' },
  { title: 'story4', body: 'story4Body' },
];

const BUBBLES = [
  { cls: 'b1', lang: 'தமிழ்', text: 'தெருவில் பெரிய பள்ளம், வண்டிகள் விழுகின்றன', pos: 'left-[4%] top-[12%]' },
  { cls: 'b2', lang: 'Tanglish', text: 'Anna Nagar la periya pallam, bike la vizhunthutten', pos: 'right-[2%] top-[34%]' },
  { cls: 'b3', lang: 'English', text: 'Huge pothole on 2nd Avenue — two falls today', pos: 'left-[8%] bottom-[16%]' },
];

/* 12 pins scattered around the centre, collapsing into one */
const PINS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.3;
  const r = 30 + (i % 3) * 7;
  return { x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r * 0.72 };
});

function useStoryMode() {
  const [mode, setMode] = useState<'scrub' | 'static'>('static');
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const set = () => setMode(mq.matches ? 'scrub' : 'static');
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  return mode;
}

/** Sticky, scroll-scrubbed four-stage story. Static stacked cards on small screens / reduced motion. */
export function ScrollStory() {
  const mode = useStoryMode();
  return mode === 'scrub' ? <ScrubStory /> : <StaticStory />;
}

function ScrubStory() {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useLayoutEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (st) => {
            const time = st.progress * tl.duration();
            setStage(time < 0.75 ? 0 : time < 1.85 ? 1 : time < 3.0 ? 2 : 3);
          },
        },
      });
      // initial states
      gsap.set(['.b1', '.b2', '.b3'], { autoAlpha: 0, y: 40 });
      gsap.set('.chip', { autoAlpha: 0, scale: 0.4 });
      gsap.set('.pin', { autoAlpha: 0, scale: 0.4 });
      gsap.set('.merge-badge', { autoAlpha: 0, scale: 0.4 });
      gsap.set('.stream', { strokeDashoffset: 1 });
      gsap.set(['.dept', '.sla'], { autoAlpha: 0, y: 16 });
      gsap.set('.core', { scale: 0.85, autoAlpha: 0.55 });

      // stage 1 — bubbles float in
      tl.to('.b1', { autoAlpha: 1, y: 0, duration: 0.3 }, 0.05)
        .to('.b2', { autoAlpha: 1, y: 0, duration: 0.3 }, 0.15)
        .to('.b3', { autoAlpha: 1, y: 0, duration: 0.3 }, 0.25)
        // stage 2 — one bubble flies into the core; chips pop out
        .to('.core', { scale: 1, autoAlpha: 1, duration: 0.25 }, 0.8)
        .to(['.b1', '.b3'], { autoAlpha: 0, y: -20, duration: 0.25 }, 0.85)
        .to('.b2', { left: '50%', top: '50%', right: 'auto', xPercent: -50, yPercent: -50, scale: 0.15, autoAlpha: 0, duration: 0.4 }, 0.9)
        .to('.core', { scale: 1.18, duration: 0.15, yoyo: true, repeat: 1 }, 1.25)
        .to('.chip', { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.08 }, 1.35)
        // stage 3 — chips leave, 12 pins appear and collapse into one
        .to('.chip', { autoAlpha: 0, scale: 0.6, duration: 0.2 }, 1.85)
        .to('.core', { autoAlpha: 0.15, scale: 0.7, duration: 0.25 }, 1.85)
        .to('.pin', { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.02 }, 1.95)
        .to('.pin', { left: '50%', top: '50%', duration: 0.45, ease: 'power3.inOut' }, 2.35)
        .to('.pin:not(.pin-0)', { autoAlpha: 0, duration: 0.1 }, 2.75)
        .to('.merge-badge', { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 2.78)
        // stage 4 — stream to the Roads desk, SLA clock appears
        .to('.merge-badge', { autoAlpha: 0, duration: 0.15 }, 3.05)
        .to('.pin-0', { left: '22%', top: '72%', duration: 0.3 }, 3.05)
        .to('.dept', { autoAlpha: 1, y: 0, duration: 0.25 }, 3.15)
        .to('.stream', { strokeDashoffset: 0, duration: 0.4, ease: 'none' }, 3.25)
        .to('.sla', { autoAlpha: 1, y: 0, duration: 0.25 }, 3.6)
        .to({}, { duration: 0.35 }, 3.85);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[420vh] bg-background" aria-label={t('story1')}>
      <div className="sticky top-[4.25rem] flex h-[calc(100svh-4.25rem)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_1.1fr] items-center gap-12 px-6">
          {/* sentences */}
          <div className="relative h-[260px]">
            {STAGES.map((s, i) => (
              <div
                key={s.title}
                className={cn('absolute inset-0 flex flex-col justify-center transition-all duration-500', stage === i ? 'translate-y-0 opacity-100' : stage > i ? '-translate-y-6 opacity-0' : 'translate-y-6 opacity-0')}
                aria-hidden={stage !== i}
              >
                <p className="mb-4 font-mono text-xs font-semibold tracking-widest text-brand-600">0{i + 1} / 04</p>
                <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground xl:text-6xl">{t(s.title)}</h2>
                <p className="mt-5 max-w-md text-lg text-muted-foreground">{t(s.body)}</p>
              </div>
            ))}
            <div className="absolute -left-6 top-1/2 flex -translate-y-1/2 flex-col gap-2" aria-hidden>
              {STAGES.map((_, i) => (
                <span key={i} className={cn('w-1 rounded-full transition-all duration-300', stage === i ? 'h-8 bg-brand-600' : 'h-2 bg-border')} />
              ))}
            </div>
          </div>

          {/* stage */}
          <div className="relative aspect-square w-full max-w-[min(560px,72svh)] justify-self-center rounded-[2.5rem] border border-border bg-gradient-to-br from-brand-50 via-card to-teal-50/60 shadow-lift">
            <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-grid opacity-60" />
            {BUBBLES.map((b) => (
              <div key={b.cls} className={cn(b.cls, 'absolute max-w-[62%] rounded-2xl rounded-bl-md border border-border bg-card p-3.5 shadow-lift', b.pos)}>
                <span className="mb-1 inline-block rounded-full bg-navy-900 px-2 py-0.5 text-[0.625rem] font-bold text-white">{b.lang}</span>
                <p className="text-sm font-medium text-foreground">{b.text}</p>
              </div>
            ))}
            <div className="core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <AiCore size={150} />
            </div>
            {[
              { icon: Construction, k: 'Roads & Potholes', pos: 'left-[8%] top-[16%]' },
              { icon: Building2, k: 'Roads Dept', pos: 'right-[6%] top-[22%]' },
              { icon: null, k: 'P4 · High', pos: 'left-1/2 bottom-[12%] -translate-x-1/2' },
            ].map((c) => (
              <div key={c.k} className={cn('chip absolute', c.pos)}>
                <span className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lift ring-1 ring-inset', c.icon ? 'bg-card text-foreground ring-border' : 'bg-orange-50 text-orange-700 ring-orange-500/30')}>
                  {c.icon ? <c.icon className="size-4 text-brand-600" /> : <span className="size-2 rounded-full bg-orange-500" />}
                  {c.k}
                </span>
              </div>
            ))}
            {PINS.map((p, i) => (
              <span key={i} className={cn('pin absolute -translate-x-1/2 -translate-y-full', `pin-${i}`)} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <MapPin className="size-7 fill-red-500 text-white drop-shadow" strokeWidth={1.5} />
              </span>
            ))}
            <span className="merge-badge absolute left-[calc(50%+14px)] top-[calc(50%-46px)] rounded-full bg-navy-900 px-2.5 py-1 text-sm font-bold text-white shadow-lift">+11</span>
            <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path className="stream" d="M22 70 C 40 40, 60 30, 76 26" fill="none" stroke="url(#stream-g)" strokeWidth="0.9" strokeLinecap="round" pathLength={1} strokeDasharray="1" />
              <defs>
                <linearGradient id="stream-g" x1="0" x2="1">
                  <stop offset="0" stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div className="dept absolute right-[8%] top-[14%] flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-4 shadow-lift">
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Construction className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">Roads</span>
                <span className="block text-xs text-subtle">Anna Nagar desk</span>
              </span>
            </div>
            <div className="sla absolute bottom-[10%] right-[10%] flex items-center gap-3 rounded-2xl bg-navy-900 p-3 pr-5 text-white shadow-lift">
              <Clock className="size-5 text-gold-soft" />
              <span>
                <span className="block font-mono text-xl font-bold tabular-nums">23:59:41</span>
                <span className="block text-xs text-slate-300">P4 · 24h deadline</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StaticStory() {
  const { t } = useI18n();
  return (
    <section className="bg-background py-20" aria-label={t('story1')}>
      <div className="mx-auto max-w-xl space-y-16 px-5">
        {STAGES.map((s, i) => (
          <div key={s.title}>
            <p className="mb-3 font-mono text-xs font-semibold tracking-widest text-brand-600">0{i + 1} / 04</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">{t(s.title)}</h2>
            <p className="mt-3 text-base text-muted-foreground">{t(s.body)}</p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-50 via-card to-teal-50/60 p-5 shadow-soft">
              {i === 0 && (
                <div className="space-y-2.5">
                  {BUBBLES.map((b) => (
                    <div key={b.cls} className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card p-3 shadow-soft odd:ml-auto">
                      <span className="mb-1 inline-block rounded-full bg-navy-900 px-2 py-0.5 text-[0.625rem] font-bold text-white">{b.lang}</span>
                      <p className="text-sm">{b.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {i === 1 && (
                <div className="flex flex-col items-center gap-4">
                  <AiCore size={88} />
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold ring-1 ring-border">Roads & Potholes</span>
                    <span className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold ring-1 ring-border">Roads Dept</span>
                    <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700 ring-1 ring-orange-500/30">P4 · High</span>
                  </div>
                </div>
              )}
              {i === 2 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="grid grid-cols-6 gap-1 opacity-50">
                    {PINS.map((_, k) => (
                      <MapPin key={k} className="size-4 fill-red-400 text-white" />
                    ))}
                  </div>
                  <span className="text-2xl text-subtle">→</span>
                  <span className="relative">
                    <MapPin className="size-10 fill-red-500 text-white drop-shadow" strokeWidth={1.5} />
                    <span className="absolute -right-6 -top-2 rounded-full bg-navy-900 px-2 py-0.5 text-xs font-bold text-white">+11</span>
                  </span>
                </div>
              )}
              {i === 3 && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="flex items-center gap-2 rounded-2xl bg-card p-2.5 pr-4 shadow-soft ring-1 ring-border">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                      <Construction className="size-4" />
                    </span>
                    <span className="text-sm font-bold">Roads</span>
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl bg-navy-900 p-2.5 pr-4 text-white">
                    <Clock className="size-4 text-gold-soft" />
                    <span className="font-mono font-bold">23:59:41</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
