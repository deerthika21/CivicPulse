import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id="cp-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3730A3" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#cp-logo)" />
      <path d="M5 17h5l3-7 4 13 3-6h7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cn('font-display text-[17px] font-bold tracking-tight', light ? 'text-white' : 'text-foreground')}>
        Civic<span className={light ? 'text-teal-300' : 'text-brand-600'}>Pulse</span>
      </span>
    </span>
  );
}
