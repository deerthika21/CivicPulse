import { cn } from '@/lib/utils';

/**
 * CSS-only "AI core": a lit sphere with two tilted orbit rings and a breathing glow.
 * Cheap enough for dashboards and the analysing overlay; motion stops under prefers-reduced-motion.
 */
export function AiCore({ size = 20, className, label }: { size?: number; className?: string; label?: string }) {
  const ring = Math.max(1, Math.round(size / 24));
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0 items-center justify-center [perspective:400px]', className)}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-[-35%] animate-[core-breathe_2.4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgb(99_102_241/0.45),rgb(13_148_136/0.18)_45%,transparent_70%)] blur-[2px]" />
      <span
        className="relative rounded-full shadow-[0_0_12px_rgb(99_102_241/0.6)]"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: 'radial-gradient(circle at 34% 30%, #ffffff 0%, #a5b4fc 18%, #6366f1 45%, #312e81 78%, #0b1f4b 100%)',
        }}
      />
      <span
        className="absolute inset-0 animate-[core-orbit_6s_linear_infinite] rounded-full border-teal-300/80 [transform-style:preserve-3d]"
        style={{ borderWidth: ring, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: 'rotateX(68deg)' }}
      />
      <span
        className="absolute inset-[8%] animate-[core-orbit-b_9s_linear_infinite] rounded-full border-amber-300/70 [transform-style:preserve-3d]"
        style={{ borderWidth: ring, borderTopColor: 'transparent', borderBottomColor: 'transparent', transform: 'rotateY(70deg)' }}
      />
    </span>
  );
}
