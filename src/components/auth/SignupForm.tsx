'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Schema = z.object({
  fullName: z.string().min(2, 'Name is required').max(200),
  email: z.string().email('Enter a valid email address'),
  phoneE164: z
    .string()
    .regex(/^\+\d{8,19}$/, 'Use E.164 format, e.g. +18761234567')
    .or(z.literal(''))
    .optional(),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});
type Form = z.infer<typeof Schema>;

/** Pull a useful message out of a non-OK response body. */
async function extractError(res: Response): Promise<string> {
  if (res.status === 409) return 'An account with this email already exists.';
  try {
    const body = await res.json();
    // ASP.NET ProblemDetails: { type, title, status, errors: { FieldName: [msg] } }
    if (body?.errors && typeof body.errors === 'object') {
      const messages = Object.values(body.errors).flat() as string[];
      if (messages.length) return messages.join(' ');
    }
    if (typeof body?.error === 'string') return body.error;
    if (typeof body?.title === 'string') return body.title;
    return `Server returned ${res.status}.`;
  } catch {
    return `Server returned ${res.status}.`;
  }
}

export default function SignupForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(Schema), defaultValues: { email: defaultEmail } });

  const onSubmit = (data: Form) =>
    startTransition(async () => {
      setServerError(null);

      let res: Response;
      try {
        res = await fetch(`${getApiBaseUrl()}/api/v1/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            phoneE164: data.phoneE164 || undefined,
          }),
        });
      } catch (err) {
        setServerError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }

      if (!res.ok) {
        setServerError(await extractError(res));
        return;
      }

      // Account created — sign in via NextAuth credentials so the session is set up.
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError('Account created but sign-in failed. Try logging in.');
        return;
      }

      router.push('/me');
      router.refresh();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="fullName" autoComplete="name" className="pl-9" {...register('fullName')} />
        </div>
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" autoComplete="email" className="pl-9" {...register('email')} />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone <span className="text-xs font-normal text-muted-foreground">(optional, E.164)</span>
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="phone" type="tel" autoComplete="tel" className="pl-9" placeholder="+18761234567" {...register('phoneE164')} />
        </div>
        {errors.phoneE164 && <p className="text-sm text-destructive">{errors.phoneE164.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" type="password" autoComplete="new-password" className="pl-9" {...register('password')} />
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
      </div>

      {serverError && (
        <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
