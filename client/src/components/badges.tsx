import { AlertTriangle, Clock, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { CATEGORY_ICONS, PRIORITY_META, SLA_META, STATUS_META } from '@/lib/constants';
import { slaCountdown } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { IssueStatus, SlaState } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PriorityBadge({ priority, ta: taProp, className, size = 'sm' }: { priority: number; ta?: boolean; className?: string; size?: 'sm' | 'lg' }) {
  const { lang } = useI18n();
  const ta = taProp ?? lang === 'ta';
  const m = PRIORITY_META[priority] ?? PRIORITY_META[3];
  return (
    <Badge className={cn(m.badge, size === 'lg' && 'gap-2 px-3.5 py-1.5 text-sm font-semibold', className)}>
      <span className={cn('rounded-full', size === 'lg' ? 'size-2.5' : 'size-1.5')} style={{ background: m.color }} aria-hidden />
      P{priority} · {ta ? m.ta : m.label}
    </Badge>
  );
}

export function StatusBadge({ status, ta: taProp }: { status: IssueStatus; ta?: boolean }) {
  const { lang } = useI18n();
  const ta = taProp ?? lang === 'ta';
  const m = STATUS_META[status];
  return (
    <Badge className={m.badge}>
      <span className={cn('size-1.5 rounded-full', m.dot)} aria-hidden />
      {ta ? m.ta : m.label}
    </Badge>
  );
}

export function SlaBadge({ state, dueAt }: { state: SlaState; dueAt?: string }) {
  const { lang } = useI18n();
  const m = SLA_META[state];
  const label = lang === 'ta' ? m.ta : m.label;
  const countdown = dueAt && (state === 'on_track' || state === 'at_risk' || state === 'breached') ? slaCountdown(dueAt).text : null;
  return (
    <Badge className={cn(m.badge, 'font-semibold tabular-nums')}>
      {state === 'breached' ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {countdown ?? label}
    </Badge>
  );
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
  return (
    <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600', className)}>
      <Icon className="size-4" strokeWidth={2} />
    </span>
  );
}

export function CategoryLabel({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon className="size-3.5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden />
      {category}
    </span>
  );
}

export function ReportCountBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <Badge className="bg-brand-50 font-semibold text-brand-800 ring-brand-500/20">
      <Users className="size-3" /> {count}
    </Badge>
  );
}

export function AiFallbackBadge() {
  return (
    <Badge className="bg-amber-50 text-amber-800 ring-amber-500/30" title="Gemini was unavailable; defaults applied — please review">
      <Sparkles className="size-3" /> Needs review
    </Badge>
  );
}
