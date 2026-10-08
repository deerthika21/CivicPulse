import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Original CivicPulse seal — NOT a government emblem.
 * Circular navy seal, gold rings, a stylised gopuram-inspired tiered line motif
 * and a pulse line running through its base.
 */
export function Emblem({ className, title = 'CivicPulse seal' }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={cn('size-10 shrink-0', className)} role="img" aria-label={title}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#1d3a7e" />
          <stop offset="1" stopColor="#0b1f4b" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dd8b" />
          <stop offset="0.55" stopColor="#c9a227" />
          <stop offset="1" stopColor="#a8820f" />
        </linearGradient>
        <path id={`${id}-arc`} d="M 11 32 A 21 21 0 0 1 53 32" fill="none" />
      </defs>
      {/* seal */}
      <circle cx="32" cy="32" r="31" fill={`url(#${id}-bg)`} />
      <circle cx="32" cy="32" r="29.2" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.4" />
      <circle cx="32" cy="32" r="25.6" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="0.6" strokeDasharray="0.9 1.6" />
      {/* lettering on the upper arc */}
      <text fontSize="4.6" fontWeight="700" letterSpacing="1.3" fill="#e6c868" fontFamily="Plus Jakarta Sans, Inter, sans-serif">
        <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
          CIVICPULSE
        </textPath>
      </text>
      {/* gopuram-inspired tiers (line motif) */}
      <g fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 18.5 v-2.4" />
        <circle cx="32" cy="15.4" r="0.9" fill="#e6c868" stroke="none" />
        <path d="M29.2 21.2 h5.6 l-0.8 -2.7 h-4 z" />
        <path d="M27.4 25 h9.2 l-0.9 -3.8 h-7.4 z" />
        <path d="M25.6 29 h12.8 l-0.9 -4 h-11 z" />
        <path d="M23.8 33.4 h16.4 l-0.9 -4.4 h-14.6 z" />
        <path d="M30.6 33.4 v-2.6 a1.4 1.4 0 0 1 2.8 0 v2.6" />
      </g>
      {/* pulse line through the base */}
      <path d="M12.5 39.5 h11 l2.4 -4.2 l3.6 8.6 l3.1 -6.6 l2.1 2.2 h16.8" fill="none" stroke="#2dd4bf" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      {/* base mark */}
      <path d="M22 47.5 h20" stroke={`url(#${id}-gold)`} strokeWidth="1" strokeLinecap="round" />
      <text x="32" y="53.2" fontSize="3.6" fontWeight="600" letterSpacing="0.9" textAnchor="middle" fill="#cbd5e1" fontFamily="Inter, sans-serif">
        CHENNAI
      </text>
    </svg>
  );
}

export function Wordmark({ className, light, sub }: { className?: string; light?: boolean; sub?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Emblem />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display text-[1.125rem] font-bold tracking-tight', light ? 'text-white' : 'text-navy-900 dark:text-white')}>
          Civic<span className={light ? 'text-gold-soft' : 'text-brand-600 dark:text-gold-soft'}>Pulse</span>
        </span>
        {sub && <span className={cn('mt-1 text-[0.6875rem] font-medium', light ? 'text-slate-300' : 'text-subtle')}>{sub}</span>}
      </span>
    </span>
  );
}
