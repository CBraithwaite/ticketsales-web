'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import {
  CATEGORIES, CATEGORY_LABELS, PARISHES, PARISH_LABELS,
} from '@/types/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const Schema = z
  .object({
    name: z.string().min(2, 'Event name is required').max(200),
    category: z.enum(CATEGORIES),
    description: z.string().min(1, 'Description is required'),
    venueName: z.string().min(2, 'Venue name is required').max(200),
    venueAddress: z.string().min(2, 'Venue address is required').max(500),
    parish: z.enum(PARISHES),
    startsAt: z.string().min(1, 'Start time is required'),
    endsAt: z.string().min(1, 'End time is required'),
    ageRestriction: z.string().max(50).or(z.literal('')).optional(),
    dressCode: z.string().max(200).or(z.literal('')).optional(),
    coverImageUrl: z.string().url().or(z.literal('')).optional(),
    tierName: z.string().min(1, 'Tier name is required').max(100),
    priceAmount: z.coerce.number().nonnegative('Price must be 0 or more'),
    currency: z.enum(['JMD', 'USD']),
    inventoryTotal: z.coerce.number().int().min(1, 'At least 1 ticket'),
    minPerOrder: z.coerce.number().int().min(1).max(50),
    maxPerOrder: z.coerce.number().int().min(1).max(50),
    publishImmediately: z.boolean(),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'End time must be after start time',
    path: ['endsAt'],
  })
  .refine((d) => d.maxPerOrder >= d.minPerOrder, {
    message: 'Max per order must be at least min per order',
    path: ['maxPerOrder'],
  });

type Form = z.infer<typeof Schema>;

async function extractError(res: Response): Promise<string> {
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

export default function CreateEventForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: {
      category: 'Concert',
      parish: 'Kingston',
      currency: 'JMD',
      tierName: 'General Admission',
      minPerOrder: 1,
      maxPerOrder: 10,
      publishImmediately: false,
    },
  });

  const onSubmit = (data: Form) =>
    start(async () => {
      setServerError(null);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
      };

      // 1. Create the event (always created as Draft).
      const createRes = await fetch(`${getApiBaseUrl()}/api/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          description: data.description,
          venueName: data.venueName,
          venueAddress: data.venueAddress,
          parish: data.parish,
          startsAt: new Date(data.startsAt).toISOString(),
          endsAt: new Date(data.endsAt).toISOString(),
          ageRestriction: data.ageRestriction || undefined,
          dressCode: data.dressCode || undefined,
          coverImageUrl: data.coverImageUrl || undefined,
          tier: {
            name: data.tierName,
            priceAmount: data.priceAmount,
            currency: data.currency,
            inventoryTotal: data.inventoryTotal,
            minPerOrder: data.minPerOrder,
            maxPerOrder: data.maxPerOrder,
          },
        }),
      });

      if (!createRes.ok) {
        setServerError(await extractError(createRes));
        return;
      }

      const created = (await createRes.json()) as { id: string; slug: string };

      // 2. Optionally publish.
      if (data.publishImmediately) {
        const pubRes = await fetch(`${getApiBaseUrl()}/api/v1/events/${created.id}/publish`, {
          method: 'POST',
          headers,
        });
        if (!pubRes.ok) {
          setServerError(`Event created as draft, but publishing failed: ${await extractError(pubRes)}`);
          return;
        }
      }

      router.push('/organizer');
      router.refresh();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Event details
        </legend>

        <Field id="name" label="Event name" reg={register('name')} err={errors.name?.message} />

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="category"
            label="Category"
            options={CATEGORIES.map((v) => [v, CATEGORY_LABELS[v]])}
            reg={register('category')}
            err={errors.category?.message}
          />
          <Select
            id="parish"
            label="Parish"
            options={PARISHES.map((v) => [v, PARISH_LABELS[v]])}
            reg={register('parish')}
            err={errors.parish?.message}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={5} {...register('description')} className="mt-1" />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <Field id="coverImageUrl" label="Cover image URL" placeholder="https://…" reg={register('coverImageUrl')} err={errors.coverImageUrl?.message} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Venue & schedule
        </legend>
        <Field id="venueName" label="Venue name" reg={register('venueName')} err={errors.venueName?.message} />
        <Field id="venueAddress" label="Venue address" reg={register('venueAddress')} err={errors.venueAddress?.message} />

        <div className="grid grid-cols-2 gap-3">
          <Field id="startsAt" type="datetime-local" label="Starts at" reg={register('startsAt')} err={errors.startsAt?.message} />
          <Field id="endsAt" type="datetime-local" label="Ends at" reg={register('endsAt')} err={errors.endsAt?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id="ageRestriction" label="Age restriction" placeholder="21+" reg={register('ageRestriction')} err={errors.ageRestriction?.message} />
          <Field id="dressCode" label="Dress code" placeholder="Smart casual" reg={register('dressCode')} err={errors.dressCode?.message} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Ticket tier
        </legend>
        <p className="text-xs text-neutral-500">
          MVP creates a single tier per event. Multi-tier comes in a follow-up.
        </p>

        <Field id="tierName" label="Tier name" reg={register('tierName')} err={errors.tierName?.message} />

        <div className="grid grid-cols-3 gap-3">
          <Field id="priceAmount" type="number" step="0.01" label="Price" reg={register('priceAmount')} err={errors.priceAmount?.message} />
          <Select
            id="currency"
            label="Currency"
            options={[['JMD', 'JMD'], ['USD', 'USD']]}
            reg={register('currency')}
            err={errors.currency?.message}
          />
          <Field id="inventoryTotal" type="number" label="Inventory" reg={register('inventoryTotal')} err={errors.inventoryTotal?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id="minPerOrder" type="number" label="Min per order" reg={register('minPerOrder')} err={errors.minPerOrder?.message} />
          <Field id="maxPerOrder" type="number" label="Max per order" reg={register('maxPerOrder')} err={errors.maxPerOrder?.message} />
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-lg border border-input bg-muted/50 p-3">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-input" {...register('publishImmediately')} />
        <span className="text-sm">
          <span className="font-semibold">Publish immediately</span>
          <span className="block text-xs text-muted-foreground">
            Otherwise it stays as a draft and you can publish later from your dashboard.
          </span>
        </span>
      </label>

      {serverError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Create event'}
      </Button>
    </form>
  );
}

function Field({
  id, label, type = 'text', placeholder, step, reg, err,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
  reg: ReturnType<ReturnType<typeof useForm<Form>>['register']>;
  err?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} step={step} placeholder={placeholder} {...reg} className="mt-1" />
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function Select({
  id, label, options, reg, err,
}: {
  id: string;
  label: string;
  options: Array<readonly [string, string]>;
  reg: ReturnType<ReturnType<typeof useForm<Form>>['register']>;
  err?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        {...reg}
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
