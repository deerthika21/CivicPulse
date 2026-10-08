import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-mesh p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <Logo className="relative" />
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-card shadow-lift ring-1 ring-border">
        <Compass className="size-7 text-brand-600" />
      </div>
      <div className="relative space-y-2">
        <p className="font-display text-6xl font-extrabold text-brand-gradient">404</p>
        <p className="text-muted-foreground">This page doesn’t exist — it may have moved.</p>
      </div>
      <Button asChild size="lg" className="relative">
        <Link to="/">
          <ArrowLeft /> Back to home
        </Link>
      </Button>
    </div>
  );
}
