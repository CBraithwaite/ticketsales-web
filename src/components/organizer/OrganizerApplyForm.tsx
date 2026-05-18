'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const Schema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(200),
  contactName: z.string().min(2, 'Contact name is required').max(200),
  contactEmail: z.string().email('Enter a valid email address'),
  contactPhone: z
    .string()
    .regex(/^\+\d{8,19}$/, 'Use E.164 format, e.g. +18761234567'),
  taxRegistrationNumber: z.string().max(20).or(z.literal('')).optional(),
});
type FormValues = z.infer<typeof Schema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      contactName: session?.user?.fullName ?? '',
      contactEmail: session?.user?.email ?? '',
    },
  });

  const onSubmit = (data: FormValues) =>
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

      await update();
      router.push('/organizer');
      router.refresh();
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact phone</FormLabel>
              <FormControl>
                <Input placeholder="+18761234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxRegistrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TRN</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Taxpayer Registration Number (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Submitting…' : 'Apply to be an organizer'}
        </Button>
        <p className="text-xs text-muted-foreground">
          For the MVP, applications are auto-approved. The admin review flow lands later.
        </p>
      </form>
    </Form>
  );
}
