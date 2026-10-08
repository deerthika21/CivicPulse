import { lazy, Suspense, useEffect, useState } from 'react';
import { AiCore } from '@/components/AiCore';
import { canRunHeavyVisuals } from '@/lib/a11y';
import { cn } from '@/lib/utils';

const CityScene = lazy(() => import('./CityScene'));

/** Static stand-in: same composition, zero JS cost. Used as Suspense fallback and on low-power / reduced-motion. */
export function StaticScene({ variant = 'hero', className }: { variant?: 'hero' | 'core'; className?: string }) {
  return (
    <div className={cn('pointer-events-none relative overflow-hidden', className)} aria-hidden>
      {variant === 'hero' && (
        <div className="absolute inset-x-[-10%] bottom-[-30%] h-[70%] [transform:perspective(900px)_rotateX(62deg)] bg-[radial-gradient(rgb(99_102_241/0.55)_1px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      )}
      <svg className="absolute left-1/2 top-[18%] hidden w-[min(80%,720px)] -translate-x-1/2 lg:left-[70%] lg:block lg:w-[min(46%,620px)]" viewBox="0 0 600 220" fill="none">
        <path d="M40 200 Q300 -60 560 200" stroke="#e6c868" strokeOpacity="0.25" />
        {Array.from({ length: 10 }, (_, i) => {
          const tt = i / 9;
          const x = (1 - tt) * (1 - tt) * 40 + 2 * (1 - tt) * tt * 300 + tt * tt * 560;
          const y = (1 - tt) * (1 - tt) * 200 + 2 * (1 - tt) * tt * -60 + tt * tt * 200;
          return <circle key={i} cx={x} cy={y} r="4" fill="#fde68a" />;
        })}
      </svg>
      <div className={cn('absolute left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[70%] lg:top-[52%]', variant === 'hero' ? 'top-[86%] opacity-80' : 'top-[52%]')}>
        <AiCore size={variant === 'hero' ? 120 : 96} />
      </div>
    </div>
  );
}

/** Lazy 3D scene with a static fallback; only mounts WebGL where it will run well. */
export function SceneSlot({ variant = 'hero', className }: { variant?: 'hero' | 'core'; className?: string }) {
  const [heavy, setHeavy] = useState(false);
  useEffect(() => setHeavy(canRunHeavyVisuals()), []);
  if (!heavy) return <StaticScene variant={variant} className={className} />;
  return (
    <Suspense fallback={<StaticScene variant={variant} className={className} />}>
      <CityScene variant={variant} className={className} />
    </Suspense>
  );
}
