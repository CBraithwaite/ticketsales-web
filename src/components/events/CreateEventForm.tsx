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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

type FormValues = z.infer<typeof Schema>;

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

  const form = useForm<FormValues>({
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

  const onSubmit = (data: FormValues) =>
    start(async () => {
      setServerError(null);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
      };

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Event details */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Event details
          </legend>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((v) => (
                        <SelectItem key={v} value={v}>{CATEGORY_LABELS[v]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parish"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parish</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARISHES.map((v) => (
                        <SelectItem key={v} value={v}>{PARISH_LABELS[v]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover image URL</FormLabel>
                <FormControl><Input placeholder="https://…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {/* Venue & schedule */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Venue &amp; schedule
          </legend>

          <FormField
            control={form.control}
            name="venueName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue address</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts at</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends at</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="ageRestriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age restriction</FormLabel>
                  <FormControl><Input placeholder="21+" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dressCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dress code</FormLabel>
                  <FormControl><Input placeholder="Smart casual" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Ticket tier */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ticket tier
          </legend>
          <p className="text-xs text-muted-foreground">
            MVP creates a single tier per event. Multi-tier comes in a follow-up.
          </p>

          <FormField
            control={form.control}
            name="tierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tier name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="priceAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="JMD">JMD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inventoryTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="minPerOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min per order</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPerOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max per order</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Publish immediately */}
        <FormField
          control={form.control}
          name="publishImmediately"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-lg border border-input bg-muted/50 p-3">
              <FormControl>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-input"
                  checked={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <div>
                <FormLabel className="text-sm font-semibold cursor-pointer">
                  Publish immediately
                </FormLabel>
                <FormDescription className="text-xs mt-0.5">
                  Otherwise it stays as a draft and you can publish later from your dashboard.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {serverError && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Saving…' : 'Create event'}
        </Button>
      </form>
    </Form>
  );
}
