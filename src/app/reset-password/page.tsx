'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const Schema = z.object({
  newPassword: z.string().min(10, 'Password must be at least 10 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type Form = z.infer<typeof Schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new reset link.');
  }, [token]);

  const onSubmit = async (data: Form) => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Error (${res.status})`);
      }

      // The API returns a full TokenResponse — sign in automatically via NextAuth.
      const tokenData = await res.json() as { me?: { email?: string } };
      const email = tokenData.me?.email ?? '';

      if (email) {
        // Sign in silently; if it fails the user can just log in manually.
        await signIn('credentials', { email, password: data.newPassword, redirect: false });
      }

      setDone(true);
      setTimeout(() => router.push('/me'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              {done
                ? 'Your password has been updated.'
                : 'Choose a strong password for your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Password updated!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You&apos;re now signed in. Redirecting…
                  </p>
                </div>
              </div>
            ) : !token ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">Invalid link</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This link is missing a reset token.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      autoFocus
                      className="pl-9 pr-10"
                      placeholder="At least 10 characters"
                      {...register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="pl-9"
                      placeholder="Repeat your password"
                      {...register('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {error && (
                  <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <p>{error}</p>
                    {error.includes('invalid or has expired') && (
                      <Link href="/forgot-password" className="mt-1 block font-medium underline">
                        Request a new reset link →
                      </Link>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</>
                  ) : (
                    'Update password'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Remembered it?{' '}
                  <Link href="/login" className="underline hover:text-foreground">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
