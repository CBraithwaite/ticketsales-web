'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type Path,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiBaseUrl } from '@/lib/api';
import {
  CATEGORIES, CATEGORY_LABELS, PARISHES, PARISH_LABELS,
} from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Copy, CalendarDays, CalendarRange } from 'lucide-react';
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
import { DateTimePicker } from '@/components/ui/DateTimePicker';

const CURRENCIES = ['JMD', 'USD'] as const;

const TierSchema = z
  .object({
    name: z.string().min(1, 'Tier name is required').max(100),
    priceAmount: z.coerce.number().nonnegative('Price must be 0 or more'),
    currency: z.enum(CURRENCIES),
    inventoryTotal: z.coerce.number().int().min(1, 'At least 1 ticket'),
    minPerOrder: z.coerce.number().int().min(1).max(50),
    maxPerOrder: z.coerce.number().int().min(1).max(50),
  })
  .refine((d) => d.maxPerOrder >= d.minPerOrder, {
    message: 'Max per order must be at least min per order',
    path: ['maxPerOrder'],
  });

const OccurrenceSchema = z
  .object({
    startsAt: z.string().min(1, 'Start time is required'),
    endsAt: z.string().min(1, 'End time is required'),
    label: z.string().max(100).or(z.literal('')).optional(),
    tiers: z.array(TierSchema).min(1, 'Add at least one tier'),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'End time must be after start time',
    path: ['endsAt'],
  });

const Schema = z
  .object({
    name: z.string().min(2, 'Event name is required').max(200),
    category: z.enum(CATEGORIES),
    description: z.string().min(1, 'Description is required'),
    venueName: z.string().min(2, 'Venue name is required').max(200),
    venueAddress: z.string().min(2, 'Venue address is required').max(500),
    parish: z.enum(PARISHES),
    ageRestriction: z.string().max(50).or(z.literal('')).optional(),
    dressCode: z.string().max(200).or(z.literal('')).optional(),
    coverImageUrl: z.string().url().or(z.literal('')).optional(),
    eventType: z.enum(['SingleDate', 'Series']),
    publishImmediately: z.boolean(),
    // Single-date only
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    tier: TierSchema.optional(),
    // Series only
    occurrences: z.array(OccurrenceSchema).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.eventType === 'SingleDate') {
      if (!d.startsAt)
        ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'Start time is required' });
      if (!d.endsAt)
        ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time is required' });
      if (d.startsAt && d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt))
        ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time must be after start time' });
      if (!d.tier)
        ctx.addIssue({ code: 'custom', path: ['tier'], message: 'Ticket tier is required' });
    } else if (!d.occurrences || d.occurrences.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['occurrences'], message: 'Add at least one date' });
    }
  });

type FormValues = z.infer<typeof Schema>;

const blankTier = () => ({
  name: 'General Admission',
  priceAmount: 0,
  currency: 'JMD' as const,
  inventoryTotal: 100,
  minPerOrder: 1,
  maxPerOrder: 10,
});

const blankOccurrence = () => ({
  startsAt: '',
  endsAt: '',
  label: '',
  tiers: [blankTier()],
});

// datetime-local helpers: format a Date as the local "YYYY-MM-DDTHH:mm" the input expects,
// and shift a local datetime string by N days (keeping the same time of day).
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const shiftDay = (s: string | undefined, days: number) => {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return toLocalInput(d);
};

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
      eventType: 'SingleDate',
      publishImmediately: false,
      tier: blankTier(),
      occurrences: [],
    },
  });

  const eventType = form.watch('eventType');

  const occurrences = useFieldArray({ control: form.control, name: 'occurrences' });

  const setEventType = (next: 'SingleDate' | 'Series') => {
    form.setValue('eventType', next);
    if (next === 'Series' && occurrences.fields.length === 0) {
      occurrences.append(blankOccurrence());
    }
  };

  // Smart "add date": clone the previous date's tiers (prices/capacity) and advance
  // one day at the same time, so organizers only adjust what changed.
  const addDate = () => {
    const list = form.getValues('occurrences') ?? [];
    if (list.length === 0) {
      occurrences.append(blankOccurrence());
      return;
    }
    const last = list[list.length - 1];
    occurrences.append({
      startsAt: shiftDay(last.startsAt, 1),
      endsAt: shiftDay(last.endsAt, 1),
      label: '',
      tiers: (last.tiers ?? [blankTier()]).map((t) => ({ ...t })),
    });
  };

  const duplicateDate = (index: number) => {
    const src = (form.getValues('occurrences') ?? [])[index];
    if (!src) return;
    occurrences.insert(index + 1, {
      ...src,
      label: src.label ? `${src.label} (copy)` : '',
      tiers: (src.tiers ?? []).map((t) => ({ ...t })),
    });
  };

  // Live summary of the series being built.
  const watchedOccurrences = form.watch('occurrences') ?? [];
  const seriesCapacity = watchedOccurrences.reduce(
    (sum, o) => sum + (o.tiers ?? []).reduce((s, t) => s + (Number(t.inventoryTotal) || 0), 0),
    0,
  );

  const onSubmit = (data: FormValues) =>
    start(async () => {
      setServerError(null);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
      };

      const common = {
        name: data.name,
        category: data.category,
        description: data.description,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        parish: data.parish,
        ageRestriction: data.ageRestriction || undefined,
        dressCode: data.dressCode || undefined,
        coverImageUrl: data.coverImageUrl || undefined,
      };

      const body =
        data.eventType === 'Series'
          ? {
              ...common,
              type: 'Series',
              // event-level dates are derived server-side; send the earliest for safety
              startsAt: new Date(data.occurrences![0].startsAt).toISOString(),
              endsAt: new Date(data.occurrences![0].endsAt).toISOString(),
              occurrences: data.occurrences!.map((o) => ({
                startsAt: new Date(o.startsAt).toISOString(),
                endsAt: new Date(o.endsAt).toISOString(),
                label: o.label || undefined,
                tiers: o.tiers.map((t) => ({
                  name: t.name,
                  priceAmount: t.priceAmount,
                  currency: t.currency,
                  inventoryTotal: t.inventoryTotal,
                  minPerOrder: t.minPerOrder,
                  maxPerOrder: t.maxPerOrder,
                })),
              })),
            }
          : {
              ...common,
              type: 'SingleDate',
              startsAt: new Date(data.startsAt!).toISOString(),
              endsAt: new Date(data.endsAt!).toISOString(),
              tier: {
                name: data.tier!.name,
                priceAmount: data.tier!.priceAmount,
                currency: data.tier!.currency,
                inventoryTotal: data.tier!.inventoryTotal,
                minPerOrder: data.tier!.minPerOrder,
                maxPerOrder: data.tier!.maxPerOrder,
              },
            };

      const createRes = await fetch(`${getApiBaseUrl()}/api/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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

        {/* Venue */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Venue
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

        {/* Event type */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dates
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEventType('SingleDate')}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                eventType === 'SingleDate'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <CalendarDays className="h-4 w-4" /> Single date
            </button>
            <button
              type="button"
              onClick={() => setEventType('Series')}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                eventType === 'Series'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <CalendarRange className="h-4 w-4" /> Multiple dates
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {eventType === 'SingleDate'
              ? 'A single event on one date with its ticket tiers.'
              : 'A series that runs on several dates. Each date has its own tiers and ticket inventory; buyers can pick one or more dates.'}
          </p>
        </fieldset>

        {/* Single-date schedule + tier */}
        {eventType === 'SingleDate' && (
          <>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Schedule
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts at</FormLabel>
                      <FormControl>
                        <DateTimePicker value={field.value ?? ''} onChange={field.onChange} minDate={new Date()} />
                      </FormControl>
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
                      <FormControl>
                        <DateTimePicker value={field.value ?? ''} onChange={field.onChange} minDate={new Date()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket tier
              </legend>
              <TierFields
                control={form.control}
                register={form.register}
                namePrefix="tier"
                errors={form.formState.errors.tier}
              />
            </fieldset>
          </>
        )}

        {/* Series dates */}
        {eventType === 'Series' && (
          <fieldset className="space-y-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Series dates
              </legend>
              {watchedOccurrences.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {watchedOccurrences.length} date{watchedOccurrences.length !== 1 ? 's' : ''} · {seriesCapacity.toLocaleString()} tickets
                </span>
              )}
            </div>

            {occurrences.fields.map((field, index) => (
              <OccurrenceCard
                key={field.id}
                index={index}
                control={form.control}
                register={form.register}
                errors={form.formState.errors}
                onDuplicate={() => duplicateDate(index)}
                onRemove={occurrences.fields.length > 1 ? () => occurrences.remove(index) : undefined}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addDate}
            >
              <Plus className="h-4 w-4 mr-1" /> Add another date
            </Button>
            {occurrences.fields.length > 0 && (
              <p className="text-xs text-muted-foreground -mt-2">
                New dates copy the previous date&apos;s tiers and time — just adjust the day.
              </p>
            )}

            {form.formState.errors.occurrences?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.occurrences.message}</p>
            )}
          </fieldset>
        )}

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

// ---------------------------------------------------------------------------
// One date within a series: its schedule + a nested tiers field array.
// ---------------------------------------------------------------------------
function OccurrenceCard({
  index,
  control,
  register,
  errors,
  onDuplicate,
  onRemove,
}: {
  index: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  onDuplicate?: () => void;
  onRemove?: () => void;
}) {
  const tiers = useFieldArray({ control, name: `occurrences.${index}.tiers` as const });
  const occErrors = errors.occurrences?.[index];

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Date {index + 1}</p>
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} className="text-muted-foreground">
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Starts at</label>
          <Controller
            control={control}
            name={`occurrences.${index}.startsAt` as const}
            render={({ field }) => (
              <DateTimePicker value={field.value ?? ''} onChange={field.onChange} minDate={new Date()} />
            )}
          />
          {occErrors?.startsAt && <p className="text-xs text-destructive mt-1">{occErrors.startsAt.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium">Ends at</label>
          <Controller
            control={control}
            name={`occurrences.${index}.endsAt` as const}
            render={({ field }) => (
              <DateTimePicker value={field.value ?? ''} onChange={field.onChange} minDate={new Date()} />
            )}
          />
          {occErrors?.endsAt && <p className="text-xs text-destructive mt-1">{occErrors.endsAt.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium">Label (optional)</label>
        <Input placeholder="Opening Night" {...register(`occurrences.${index}.label` as const)} />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiers for this date</p>
        {tiers.fields.map((tierField, tierIndex) => (
          <div key={tierField.id} className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Tier {tierIndex + 1}</p>
              {tiers.fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => tiers.remove(tierIndex)} className="text-destructive h-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <TierFields
              control={control}
              register={register}
              namePrefix={`occurrences.${index}.tiers.${tierIndex}`}
              errors={occErrors?.tiers?.[tierIndex]}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => tiers.append(blankTier())}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add tier
        </Button>
        {occErrors?.tiers?.message && <p className="text-xs text-destructive">{occErrors.tiers.message}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable tier input grid. namePrefix is the RHF path to the tier object,
// e.g. "tier" or "occurrences.0.tiers.1".
// ---------------------------------------------------------------------------
type TierErrors = {
  name?: { message?: string };
  priceAmount?: { message?: string };
  currency?: { message?: string };
  inventoryTotal?: { message?: string };
  minPerOrder?: { message?: string };
  maxPerOrder?: { message?: string };
} | undefined;

function TierFields({
  control,
  register,
  namePrefix,
  errors,
}: {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  namePrefix: string;
  errors: TierErrors;
}) {
  const path = (suffix: string) => `${namePrefix}.${suffix}` as Path<FormValues>;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium">Tier name</label>
        <Input {...register(path('name'))} />
        {errors?.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium">Price</label>
          <Input type="number" step="0.01" {...register(path('priceAmount'))} />
          {errors?.priceAmount && <p className="text-xs text-destructive mt-1">{errors.priceAmount.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium">Currency</label>
          <FormField
            control={control}
            name={path('currency') as FieldPath<FormValues>}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value as string}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="JMD">JMD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className="text-xs font-medium">Inventory</label>
          <Input type="number" {...register(path('inventoryTotal'))} />
          {errors?.inventoryTotal && <p className="text-xs text-destructive mt-1">{errors.inventoryTotal.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Min per order</label>
          <Input type="number" {...register(path('minPerOrder'))} />
        </div>
        <div>
          <label className="text-xs font-medium">Max per order</label>
          <Input type="number" {...register(path('maxPerOrder'))} />
          {errors?.maxPerOrder && <p className="text-xs text-destructive mt-1">{errors.maxPerOrder.message}</p>}
        </div>
      </div>
    </div>
  );
}
