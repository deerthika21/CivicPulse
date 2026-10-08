import { Outlet } from 'react-router';
import { SiteFooter } from '@/components/gov/SiteFooter';
import { SiteHeader } from '@/components/gov/SiteHeader';
import { UtilityBar } from '@/components/gov/UtilityBar';

/** Public shell: utility strip → header (+ tricolour hairline) → page → formal footer. */
export function CitizenLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <UtilityBar />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
