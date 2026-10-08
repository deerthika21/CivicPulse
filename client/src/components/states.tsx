import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-card/60 px-6 py-12 text-center', className)}>
      <div className="relative">
        <div className="absolute inset-0 -m-2 rounded-full bg-brand-100/60 blur-md" />
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 ring-1 ring-brand-100">
          <Icon className="size-5 text-brand-600" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-display font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, retryLabel = 'Try again', className }: { error: Error; onRetry?: () => void; retryLabel?: string; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 px-6 py-10 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100">
        <AlertCircle className="size-5 text-red-600" />
      </div>
      <div className="space-y-1">
        <p className="font-display font-semibold text-red-950">Something went wrong</p>
        <p className="text-sm text-red-800/80">{error.message || 'Unexpected error'}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> {retryLabel}
        </Button>
      )}
    </div>
  );
}
