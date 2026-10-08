import { AlertTriangle, CheckCircle2, GitMerge, MessageSquare, PenLine, PlusCircle, TrendingUp, type LucideIcon } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { TimelineEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  created: { icon: PlusCircle, color: 'text-brand-600 bg-brand-50 ring-brand-100' },
  duplicate_merged: { icon: GitMerge, color: 'text-indigo-600 bg-indigo-50 ring-indigo-100' },
  status_changed: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
  override: { icon: PenLine, color: 'text-violet-600 bg-violet-50 ring-violet-100' },
  note: { icon: MessageSquare, color: 'text-slate-600 bg-slate-100 ring-slate-200' },
  sla_breached: { icon: AlertTriangle, color: 'text-red-600 bg-red-50 ring-red-100' },
  priority_escalated: { icon: TrendingUp, color: 'text-orange-600 bg-orange-50 ring-orange-100' },
};

/** Vertical timeline; the newest entry is highlighted as the current step. */
export function Timeline({ entries, newestFirst = true }: { entries: TimelineEntry[]; newestFirst?: boolean }) {
  const sorted = [...entries].sort((a, b) => (newestFirst ? -1 : 1) * (new Date(a.at).getTime() - new Date(b.at).getTime()));
  return (
    <ol className="relative">
      {sorted.map((e, i) => {
        const { icon: Icon, color } = ICONS[e.type] ?? ICONS.note;
        const current = newestFirst ? i === 0 : i === sorted.length - 1;
        const last = i === sorted.length - 1;
        return (
          <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />}
            <div className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1', color, current && 'ring-4')}>
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 pt-1">
              <p className={cn('text-sm leading-snug', current ? 'font-semibold text-foreground' : 'text-slate-700')}>{e.message}</p>
              <p className="mt-1 text-xs text-subtle">
                {formatDateTime(e.at)} · {e.byName || 'System'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
