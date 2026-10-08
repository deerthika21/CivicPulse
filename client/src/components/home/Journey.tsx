import { motion } from 'framer-motion';
import { CheckCircle2, GitMerge, Megaphone, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import { useI18n, type StringKey } from '@/lib/i18n';

const STEPS: { title: StringKey; body: StringKey; icon: LucideIcon }[] = [
  { title: 'journey1', body: 'journey1Body', icon: Megaphone },
  { title: 'journey2', body: 'journey2Body', icon: Sparkles },
  { title: 'journey3', body: 'journey3Body', icon: GitMerge },
  { title: 'journey4', body: 'journey4Body', icon: Wrench },
  { title: 'journey5', body: 'journey5Body', icon: CheckCircle2 },
];

export function Journey() {
  const { t } = useI18n();
  return (
    <section id="how" className="scroll-mt-24 bg-background py-24 sm:py-32" aria-labelledby="journey-title">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <h2 id="journey-title" className="max-w-2xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          {t('journeyTitle')}
        </h2>
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
          {/* connector */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border lg:left-6 lg:right-6 lg:top-[19px] lg:bottom-auto lg:h-0.5 lg:w-auto" aria-hidden>
            <motion.div
              className="h-full w-full origin-top bg-gradient-to-b from-brand-600 via-teal-500 to-gold lg:origin-left lg:bg-gradient-to-r"
              initial={{ scaleY: 0, scaleX: 0 }}
              whileInView={{ scaleY: 1, scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative flex gap-5 lg:block"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-soft ring-4 ring-background">
                <s.icon className="size-[18px]" />
              </span>
              <div className="lg:mt-6">
                <p className="font-mono text-xs font-semibold text-subtle">0{i + 1}</p>
                <h3 className="mt-1 font-display text-xl font-bold">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.body)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
