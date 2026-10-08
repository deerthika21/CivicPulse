import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CountUp } from '@/components/motion';
import { Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export type Tone = 'brand' | 'teal' | 'red' | 'amber' | 'violet' | 'emerald' | 'sky' | 'slate';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

interface Props {
  icon: LucideIcon;
  label: string;
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
  hint?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
  alert?: boolean;
}

/** KPI tile with count-up number. Clickable when `onClick` is set. */
export function StatCard({ icon: Icon, label, value, decimals, suffix, hint, tone = 'brand', loading, onClick, active, alert }: Props) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'glass group relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-2xl border border-border p-4 text-left shadow-soft transition-all duration-200 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:to-transparent before:opacity-60 dark:before:from-white/5',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lift',
        active && 'border-brand-500 ring-4 ring-brand-500/10',
        alert && 'border-red-200',
      )}
    >
      {alert && <span className="absolute inset-x-0 top-0 h-0.5 bg-red-500" />}
      <div className="relative flex min-h-9 items-start justify-between gap-2">
        <span className="pt-1 text-[0.8125rem] font-medium leading-tight text-muted-foreground">{label}</span>
        <span className={cn('flex size-8 items-center justify-center rounded-xl ring-1', TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className="relative font-display text-[1.75rem] font-bold leading-none tracking-tight">
          {value == null ? '–' : <CountUp value={value} decimals={decimals} suffix={suffix} />}
        </span>
      )}
      {hint && <span className="relative mt-auto text-xs leading-snug text-subtle">{hint}</span>}
    </Comp>
  );
}
