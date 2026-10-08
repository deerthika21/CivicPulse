import { AlertCircle, ArrowLeft } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Logo />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
        <AlertCircle className="size-6 text-red-600" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-xl font-bold">Something went wrong</p>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeft /> Back to home
        </Link>
      </Button>
    </div>
  );
}
