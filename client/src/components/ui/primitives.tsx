import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-slate-200 bg-slate-50 text-slate-700',
        className,
      )}
      {...props}
    />
  );
}

const field =
  'w-full min-w-0 rounded-xl border border-border bg-card text-base text-foreground shadow-soft outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 disabled:opacity-50 md:text-sm';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(field, 'h-11 px-3.5', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(field, 'min-h-32 resize-y px-3.5 py-3 leading-relaxed', className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('text-sm font-semibold leading-none text-foreground', className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <span className={cn('relative inline-flex', className?.includes('w-full') && 'w-full')}>
      <select
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground shadow-soft outline-none transition hover:border-slate-300 focus-visible:ring-4 focus-visible:ring-brand-500/15',
          className,
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </span>
  );
}

/** Shimmering placeholder — used instead of spinners for loading states. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden className={cn('shimmer rounded-xl', className)} {...props} />;
}
