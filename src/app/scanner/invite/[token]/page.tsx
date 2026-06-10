'use client';

import { useState, useEffect, useTransition, use } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/datetime';

interface InviteInfo {
  name: string;
  email: string;
  gate: string | null;
  eventName: string;
  eventDate: string;
  venueName: string;
}

export default function AcceptInvitePage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/v1/scanner/invite/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? 'This invite link is invalid or expired.');
          return;
        }
        setInfo(await res.json());
      })
      .catch(() => setError('Failed to load invite details.'))
      .finally(() => setLoading(false));
  }, [params.token]);

  const accept = () =>
    start(async () => {
      setError(null);

      if (password.length < 10) {
        setError('Password must be at least 10 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/scanner/invite/${params.token}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        },
      );

      if (!res.ok) {
        try {
          const body = await res.json();
          setError(body?.error ?? `Server returned ${res.status}.`);
        } catch {
          setError(`Server returned ${res.status}.`);
        }
        return;
      }

      setSuccess(true);
    });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(DEFAULT_LOCALE, {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <p className="text-center text-sm text-neutral-500">Loading invite…</p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-800">You&apos;re in!</CardTitle>
            <CardDescription className="text-green-700">
              Your scanner account has been set up. You can now sign in and scan tickets at the event.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              type="button"
              onClick={() => router.push('/login')}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error && !info) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-800">Invite unavailable</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!info) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Scanner invite</h1>
        <p className="text-sm text-neutral-600">
          You&apos;ve been invited to scan tickets at an event.
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-lg font-semibold">{info.eventName}</p>
            <p className="text-sm text-neutral-600">{fmtDate(info.eventDate)}</p>
            <p className="text-sm text-neutral-600">{info.venueName}</p>
            {info.gate && (
              <p className="text-sm text-neutral-500">
                Assigned gate: <span className="font-semibold">{info.gate}</span>
              </p>
            )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-neutral-500">Name:</span>{' '}
              <span className="font-medium">{info.name}</span>
            </p>
            <p className="text-sm">
              <span className="text-neutral-500">Email:</span>{' '}
              <span className="font-medium">{info.email}</span>
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Create a password to set up your scanner account:
            </p>
            <div>
              <Label className="mb-1">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
              />
            </div>
            <div>
              <Label className="mb-1">Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="button"
            className="mt-4 w-full"
            onClick={accept}
            disabled={pending || !password}
          >
            {pending ? 'Setting up…' : 'Accept invite & create account'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
