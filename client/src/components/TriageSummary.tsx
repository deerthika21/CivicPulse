import { Building2, Clock, Languages, Sparkles } from 'lucide-react';
import { CategoryLabel, PriorityBadge } from '@/components/badges';
import { hours } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { Complaint, Issue } from '@/lib/types';

/** Citizen-facing view of what the AI decided. */
export function TriageSummary({ complaint, issue }: { complaint: Complaint; issue: Issue | null }) {
  const { t, lang } = useI18n();
  const priority = issue?.priority ?? complaint.priority;
  const rows = [
    { icon: Building2, label: t('routedTo'), value: issue?.department ?? complaint.department },
    { icon: Clock, label: t('expectedIn'), value: hours(issue?.slaHours ?? complaint.slaHours) },
    { icon: Languages, label: t('detectedLanguage'), value: complaint.language },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryLabel category={issue?.category ?? complaint.category} className="font-medium" />
        <PriorityBadge priority={priority} ta={lang === 'ta'} />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg bg-muted/60 p-2.5">
            <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon className="size-3" /> {label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium leading-tight">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-lg border border-primary/20 bg-accent/50 p-3">
        <p className="flex items-center gap-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" /> {t('aiSummary')}
        </p>
        <p className="mt-1 text-sm">{complaint.summary}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{issue?.priorityReason ?? complaint.priorityReason}</p>
      </div>
    </div>
  );
}
