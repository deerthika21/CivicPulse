import { Activity, Loader2, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/primitives';
import { HealthBadge } from '@/components/HealthBadge';
import { useAuth } from '@/lib/auth';

const DEMO = [
  { label: 'Admin', email: 'admin@civicpulse.in', password: 'Admin@123' },
  { label: 'Roads officer', email: 'roads@civicpulse.in', password: 'Officer@123' },
  { label: 'Solid Waste officer', email: 'swm@civicpulse.in', password: 'Officer@123' },
  { label: 'Storm Water Drains officer', email: 'drains@civicpulse.in', password: 'Officer@123' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from ?? (user.role === 'admin' ? '/admin/analytics' : '/officer')} replace />;

  const submit = async (e?: FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(creds?.email ?? email, creds?.password ?? password);
      navigate(from ?? (u.role === 'admin' ? '/admin/analytics' : '/officer'), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <div className="space-y-1 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold">
            <Activity className="size-5 text-primary" /> CivicPulse
          </Link>
          <p className="text-sm text-muted-foreground">Officer &amp; admin sign in</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
          </Button>
        </form>
        <div className="space-y-2 border-t pt-4">
          <HealthBadge />
          <p className="text-xs font-medium text-muted-foreground">Demo accounts (one click)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <Button key={d.email} variant="outline" size="sm" className="h-auto whitespace-normal py-1.5 text-xs" disabled={loading} onClick={() => submit(undefined, d)}>
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
