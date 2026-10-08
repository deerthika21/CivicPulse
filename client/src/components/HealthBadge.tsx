import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ok'; data: HealthResponse };

/** Shows API + DB + Gemini status; proves client ↔ server wiring. */
export function HealthBadge() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    getHealth()
      .then((data) => setState({ kind: 'ok', data }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  }, []);

  if (state.kind === 'loading') return <Skeleton className="h-6 w-64 rounded-full" />;
  if (state.kind === 'error') return <Pill tone="bad" label={`API unreachable: ${state.message}`} />;

  const { database, gemini } = state.data;
  return (
    <div className="flex flex-wrap gap-2">
      <Pill tone="good" label="API online" />
      <Pill tone={database === 'connected' ? 'good' : 'warn'} label={`MongoDB ${database}`} />
      <Pill tone={gemini.configured ? 'good' : 'warn'} label={gemini.configured ? `Gemini · ${gemini.model}` : 'Gemini: no key'} />
    </div>
  );
}

function Pill({ tone, label }: { tone: 'good' | 'warn' | 'bad'; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        tone === 'good' && 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        tone === 'warn' && 'bg-amber-50 text-amber-700 ring-amber-500/30',
        tone === 'bad' && 'bg-red-50 text-red-700 ring-red-600/20',
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone === 'good' && 'bg-emerald-500', tone === 'warn' && 'bg-amber-500', tone === 'bad' && 'bg-red-500')} />
      {label}
    </span>
  );
}
