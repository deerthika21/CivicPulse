import { Building2, Clock, Languages, Sparkles } from 'lucide-react';
import { CategoryIcon, PriorityBadge } from '@/components/badges';
import { hours } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { Complaint, Issue } from '@/lib/types';

/** Citizen-facing view of what the AI decided — the hero moment of the demo. */
export function TriageSummary({ complaint, issue }: { complaint: Complaint; issue: Issue | null }) {
  const { t, lang } = useI18n();
  const priority = issue?.priority ?? complaint.priority;
  const category = issue?.category ?? complaint.category;
  const department = issue?.department ?? complaint.department;
  const facts = [
    { icon: Building2, label: t('department'), value: department },
    { icon: Clock, label: t('expectedIn'), value: hours(issue?.slaHours ?? complaint.slaHours) },
    { icon: Languages, label: t('detectedLanguage'), value: complaint.language },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon category={category} className="size-12 rounded-2xl [&_svg]:size-6" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-subtle">{t('category')}</p>
            <p className="font-display text-lg font-bold leading-tight">{category}</p>
          </div>
        </div>
        <PriorityBadge priority={priority} ta={lang === 'ta'} size="lg" className="shrink-0" />
      </div>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-border sm:block sm:p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
              <Icon className="size-3.5 text-brand-600" /> <span className="truncate">{label}</span>
            </dt>
            <dd className="text-right text-sm font-semibold leading-tight text-foreground sm:mt-1 sm:text-left">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="gradient-border relative overflow-hidden rounded-2xl p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-brand-500/10 blur-2xl" />
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
          <Sparkles className="size-3.5" /> {t('aiReasoning')}
        </p>
        <p className="mt-2 text-[15px] font-medium leading-snug text-foreground">{issue?.priorityReason ?? complaint.priorityReason}</p>
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{t('aiSummary')}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{complaint.summary}</p>
        </div>
      </div>
    </div>
  );
}
