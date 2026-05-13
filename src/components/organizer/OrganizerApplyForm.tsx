'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const Schema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(200),
  contactName: z.string().min(2, 'Contact name is required').max(200),
  contactEmail: z.string().email('Enter a valid email address'),
  contactPhone: z
    .string()
    .regex(/^\+\d{8,19}$/, 'Use E.164 format, e.g. +18761234567'),
  taxRegistrationNumber: z.string().max(20).or(z.literal('')).optional(),
});
type Form = z.infer<typeof Schema>;

async function extractError(res: Response): Promise<string> {
  if (res.status === 409) return 'You already have an organizer profile.';
  try {
    const body = await res.json();
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

export default function OrganizerApplyForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      contactName: session?.user?.fullName ?? '',
      contactEmail: session?.user?.email ?? '',
    },
  });

  const onSubmit = (data: Form) =>
    start(async () => {
      setServerError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/v1/organizers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          businessName: data.businessName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          taxRegistrationNumber: data.taxRegistrationNumber || undefined,
        }),
      });

      if (!res.ok) {
        setServerError(await extractError(res));
        return;
      }

      // Refresh the session so the new Organizer role is reflected.
      await update();
      router.push('/organizer');
      router.refresh();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field id="businessName" label="Business name" reg={register('businessName')} err={errors.businessName?.message} />
      <Field id="contactName" label="Contact name" reg={register('contactName')} err={errors.contactName?.message} />
      <Field id="contactEmail" label="Contact email" type="email" reg={register('contactEmail')} err={errors.contactEmail?.message} />
      <Field id="contactPhone" label="Contact phone" placeholder="+18761234567" reg={register('contactPhone')} err={errors.contactPhone?.message} />
      <Field
        id="taxRegistrationNumber"
        label="TRN"
        hint="Taxpayer Registration Number (optional)"
        reg={register('taxRegistrationNumber')}
        err={errors.taxRegistrationNumber?.message}
      />

      {serverError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Submitting…' : 'Apply to be an organizer'}
      </Button>
      <p className="text-xs text-neutral-500">
        For the MVP, applications are auto-approved. The admin review flow lands later.
      </p>
    </form>
  );
}

function Field({
  id, label, type = 'text', placeholder, hint, reg, err,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  reg: ReturnType<ReturnType<typeof useForm<Form>>['register']>;
  err?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} {...reg} className="mt-1" />
      {hint && !err && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
