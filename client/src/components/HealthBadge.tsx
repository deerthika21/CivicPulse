import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getHealth, type HealthResponse } from '@/lib/api';
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

  if (state.kind === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking API…
      </div>
    );
  }
  if (state.kind === 'error') {
    return <Pill tone="bad" label={`API unreachable: ${state.message}`} />;
  }

  const { database, gemini } = state.data;
  return (
    <div className="flex flex-wrap gap-2">
      <Pill tone="good" label="API online" />
      <Pill tone={database === 'connected' ? 'good' : 'warn'} label={`MongoDB: ${database}`} />
      <Pill tone={gemini.configured ? 'good' : 'warn'} label={gemini.configured ? `Gemini: ${gemini.model}` : 'Gemini: no key'} />
    </div>
  );
}

function Pill({ tone, label }: { tone: 'good' | 'warn' | 'bad'; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
        tone === 'bad' && 'border-red-200 bg-red-50 text-red-800',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'good' && 'bg-emerald-500',
          tone === 'warn' && 'bg-amber-500',
          tone === 'bad' && 'bg-red-500',
        )}
      />
      {label}
    </span>
  );
}
