'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import type { OccurrenceResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/datetime';

interface Props {
  eventId: string;
  occurrences: OccurrenceResponse[];
}

interface TierForm {
  name: string;
  priceAmount: number;
  currency: 'JMD' | 'USD';
  inventoryTotal: number;
  minPerOrder: number;
  maxPerOrder: number;
}

interface DateForm {
  startsAt: string;
  endsAt: string;
  label: string;
  tier: TierForm;
}

const emptyTier = (): TierForm => ({
  name: 'General Admission',
  priceAmount: 0,
  currency: 'JMD',
  inventoryTotal: 100,
  minPerOrder: 1,
  maxPerOrder: 10,
});

const emptyDate = (): DateForm => ({ startsAt: '', endsAt: '', label: '', tier: emptyTier() });

async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.errors && typeof body.errors === 'object') {
      const messages = Object.values(body.errors).flat() as string[];
      if (messages.length) return messages.join(' ');
    }
    if (typeof body?.error === 'string') return body.error;
    return `Server returned ${res.status}.`;
  } catch {
    return `Server returned ${res.status}.`;
  }
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const fmtMoney = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;

export default function OccurrenceManager({ eventId, occurrences: initial }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [occurrences, setOccurrences] = useState(initial);
  const [addingDate, setAddingDate] = useState(false);
  const [dateForm, setDateForm] = useState<DateForm>(emptyDate());
  const [addTierFor, setAddTierFor] = useState<string | null>(null); // occurrence id
  const [tierForm, setTierForm] = useState<TierForm>(emptyTier());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const base = `${getApiBaseUrl()}/api/v1/events/${eventId}`;

  const tierPayload = (t: TierForm) => ({
    name: t.name,
    priceAmount: t.priceAmount,
    currency: t.currency,
    inventoryTotal: t.inventoryTotal,
    minPerOrder: t.minPerOrder,
    maxPerOrder: t.maxPerOrder,
  });

  const addDate = () =>
    start(async () => {
      setError(null);
      const res = await fetch(`${base}/occurrences`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          startsAt: new Date(dateForm.startsAt).toISOString(),
          endsAt: new Date(dateForm.endsAt).toISOString(),
          label: dateForm.label || undefined,
          tiers: [tierPayload(dateForm.tier)],
        }),
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      const created = (await res.json()) as OccurrenceResponse;
      setOccurrences((prev) => [...prev, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setAddingDate(false);
      setDateForm(emptyDate());
      router.refresh();
    });

  const addTier = (occId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${base}/tiers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...tierPayload(tierForm), occurrenceId: occId }),
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      setAddTierFor(null);
      setTierForm(emptyTier());
      router.refresh();
    });

  const cancelDate = (occId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${base}/occurrences/${occId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      const updated = (await res.json()) as OccurrenceResponse;
      setOccurrences((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      router.refresh();
    });

  const deleteDate = (occId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${base}/occurrences/${occId}`, { method: 'DELETE', headers });
      if (!res.ok) { setError(await extractError(res)); return; }
      setOccurrences((prev) => prev.filter((o) => o.id !== occId));
      router.refresh();
    });

  const tierInputs = (form: TierForm, set: (t: TierForm) => void) => (
    <div className="space-y-3">
      <div>
        <Label className="mb-1">Tier name</Label>
        <Input value={form.name} onChange={(e) => set({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="mb-1">Price</Label>
          <Input type="number" step="0.01" value={form.priceAmount}
            onChange={(e) => set({ ...form, priceAmount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label className="mb-1">Currency</Label>
          <select
            value={form.currency}
            onChange={(e) => set({ ...form, currency: e.target.value as 'JMD' | 'USD' })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="JMD">JMD</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <Label className="mb-1">Inventory</Label>
          <Input type="number" value={form.inventoryTotal}
            onChange={(e) => set({ ...form, inventoryTotal: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1">Min per order</Label>
          <Input type="number" value={form.minPerOrder}
            onChange={(e) => set({ ...form, minPerOrder: parseInt(e.target.value) || 1 })} />
        </div>
        <div>
          <Label className="mb-1">Max per order</Label>
          <Input type="number" value={form.maxPerOrder}
            onChange={(e) => set({ ...form, maxPerOrder: parseInt(e.target.value) || 1 })} />
        </div>
      </div>
    </div>
  );

  return (
    <section className="mt-8">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Series dates ({occurrences.length})
        </h2>
        {!addingDate && (
          <Button type="button" size="sm" onClick={() => { setAddingDate(true); setDateForm(emptyDate()); setError(null); }}>
            + Add date
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <ul className="mt-3 space-y-3">
        {occurrences.map((o) => (
          <li key={o.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {o.label ? `${o.label} · ` : ''}{fmtDate(o.startsAt)} — {fmtDate(o.endsAt)}
                </p>
                <p className="text-xs text-neutral-500">
                  {o.status === 'Cancelled' ? 'Cancelled' : `${o.remainingInventory} available`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {o.status !== 'Cancelled' && (
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => { setAddTierFor(o.id); setTierForm(emptyTier()); setError(null); }}>
                    + Tier
                  </Button>
                )}
                {o.status !== 'Cancelled' && (
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => { if (confirm('Cancel this date? Existing tickets remain valid.')) cancelDate(o.id); }}>
                    Cancel
                  </Button>
                )}
                {o.tiers.every((t) => t.inventorySold === 0) && (
                  <Button type="button" variant="outline" size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => { if (confirm('Delete this date?')) deleteDate(o.id); }}>
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <ul className="mt-2 space-y-1">
              {o.tiers.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-sm">
                  <span>{t.name}</span>
                  <span className="text-neutral-500">
                    {fmtMoney(t.priceAmount, t.currency)} · {t.inventoryAvailable}/{t.inventoryTotal} left
                  </span>
                </li>
              ))}
            </ul>

            {addTierFor === o.id && (
              <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-3">
                <h4 className="text-sm font-semibold">Add tier to this date</h4>
                <div className="mt-3">{tierInputs(tierForm, setTierForm)}</div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" disabled={pending || !tierForm.name} onClick={() => addTier(o.id)}>
                    {pending ? 'Saving…' : 'Add tier'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setAddTierFor(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {addingDate && (
        <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <h3 className="text-sm font-semibold">Add new date</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Starts at</Label>
                <DateTimePicker value={dateForm.startsAt} minDate={new Date()}
                  onChange={(v) => setDateForm({ ...dateForm, startsAt: v })} />
              </div>
              <div>
                <Label className="mb-1">Ends at</Label>
                <DateTimePicker value={dateForm.endsAt} minDate={new Date()}
                  onChange={(v) => setDateForm({ ...dateForm, endsAt: v })} />
              </div>
            </div>
            <div>
              <Label className="mb-1">Label (optional)</Label>
              <Input value={dateForm.label} placeholder="Opening Night"
                onChange={(e) => setDateForm({ ...dateForm, label: e.target.value })} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">First tier</p>
            {tierInputs(dateForm.tier, (t) => setDateForm({ ...dateForm, tier: t }))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={pending || !dateForm.startsAt || !dateForm.endsAt || !dateForm.tier.name} onClick={addDate}>
              {pending ? 'Saving…' : 'Add date'}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setAddingDate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
