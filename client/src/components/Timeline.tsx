import { AlertTriangle, CheckCircle2, GitMerge, MessageSquare, PenLine, PlusCircle, TrendingUp, type LucideIcon } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { TimelineEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  created: { icon: PlusCircle, color: 'text-sky-600 bg-sky-50' },
  duplicate_merged: { icon: GitMerge, color: 'text-indigo-600 bg-indigo-50' },
  status_changed: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  override: { icon: PenLine, color: 'text-violet-600 bg-violet-50' },
  note: { icon: MessageSquare, color: 'text-slate-600 bg-slate-100' },
  sla_breached: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  priority_escalated: { icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
};

export function Timeline({ entries, newestFirst = true }: { entries: TimelineEntry[]; newestFirst?: boolean }) {
  const sorted = [...entries].sort((a, b) => (newestFirst ? -1 : 1) * (new Date(a.at).getTime() - new Date(b.at).getTime()));
  return (
    <ol className="relative space-y-4">
      {sorted.map((e, i) => {
        const { icon: Icon, color } = ICONS[e.type] ?? ICONS.note;
        return (
          <li key={i} className="flex gap-3">
            <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', color)}>
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm leading-snug">{e.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateTime(e.at)} · {e.byName || 'System'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
