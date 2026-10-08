import { AlertTriangle, Clock, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { CATEGORY_ICONS, PRIORITY_META, SLA_META, STATUS_META } from '@/lib/constants';
import { slaCountdown } from '@/lib/format';
import type { IssueStatus, SlaState } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PriorityBadge({ priority, ta, className }: { priority: number; ta?: boolean; className?: string }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META[3];
  return (
    <Badge className={cn(m.badge, className)}>
      <span className="size-2 rounded-full" style={{ background: m.color }} aria-hidden />
      P{priority} · {ta ? m.ta : m.label}
    </Badge>
  );
}

export function StatusBadge({ status, ta }: { status: IssueStatus; ta?: boolean }) {
  const m = STATUS_META[status];
  return <Badge className={m.badge}>{ta ? m.ta : m.label}</Badge>;
}

export function SlaBadge({ state, dueAt }: { state: SlaState; dueAt?: string }) {
  const m = SLA_META[state];
  const countdown = dueAt && (state === 'on_track' || state === 'at_risk' || state === 'breached') ? slaCountdown(dueAt).text : null;
  return (
    <Badge className={m.badge}>
      {state === 'breached' ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {countdown ?? m.label}
    </Badge>
  );
}

export function CategoryLabel({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      {category}
    </span>
  );
}

export function ReportCountBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <Badge className="border-indigo-200 bg-indigo-50 text-indigo-800">
      <Users className="size-3" /> {count}
    </Badge>
  );
}

export function AiFallbackBadge() {
  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-800" title="Gemini was unavailable; defaults applied — please review">
      <Sparkles className="size-3" /> Needs review
    </Badge>
  );
}
