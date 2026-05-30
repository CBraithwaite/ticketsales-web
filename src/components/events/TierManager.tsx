'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import type { TierResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/DateTimePicker';

interface Props {
  eventId: string;
  tiers: TierResponse[];
}

interface TierFormData {
  name: string;
  description: string;
  priceAmount: number;
  currency: 'JMD' | 'USD';
  inventoryTotal: number;
  minPerOrder: number;
  maxPerOrder: number;
  isTransferable: boolean;
  isRefundable: boolean;
  saleStartsAt: string;
  saleEndsAt: string;
}

const emptyTier: TierFormData = {
  name: '',
  description: '',
  priceAmount: 0,
  currency: 'JMD',
  inventoryTotal: 100,
  minPerOrder: 1,
  maxPerOrder: 10,
  isTransferable: true,
  isRefundable: true,
  saleStartsAt: '',
  saleEndsAt: '',
};

function tierToForm(t: TierResponse): TierFormData {
  return {
    name: t.name,
    description: t.description ?? '',
    priceAmount: t.priceAmount,
    currency: t.currency,
    inventoryTotal: t.inventoryTotal,
    minPerOrder: t.minPerOrder,
    maxPerOrder: t.maxPerOrder,
    isTransferable: t.isTransferable,
    isRefundable: t.isRefundable,
    saleStartsAt: t.saleStartsAt ? t.saleStartsAt.slice(0, 16) : '',
    saleEndsAt: t.saleEndsAt ? t.saleEndsAt.slice(0, 16) : '',
  };
}

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

export default function TierManager({ eventId, tiers: initialTiers }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [tiers, setTiers] = useState(initialTiers);
  const [editing, setEditing] = useState<string | null>(null);   // tier id or 'new'
  const [form, setForm] = useState<TierFormData>(emptyTier);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const startAdd = () => {
    setEditing('new');
    setForm(emptyTier);
    setError(null);
  };

  const startEdit = (t: TierResponse) => {
    setEditing(t.id);
    setForm(tierToForm(t));
    setError(null);
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  const save = () =>
    start(async () => {
      setError(null);
      const base = `${getApiBaseUrl()}/api/v1/events/${eventId}/tiers`;

      if (editing === 'new') {
        const res = await fetch(base, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            priceAmount: form.priceAmount,
            currency: form.currency,
            inventoryTotal: form.inventoryTotal,
            minPerOrder: form.minPerOrder,
            maxPerOrder: form.maxPerOrder,
            isTransferable: form.isTransferable,
            isRefundable: form.isRefundable,
            saleStartsAt: form.saleStartsAt ? new Date(form.saleStartsAt).toISOString() : undefined,
            saleEndsAt: form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : undefined,
          }),
        });
        if (!res.ok) { setError(await extractError(res)); return; }
        const created = (await res.json()) as TierResponse;
        setTiers((prev) => [...prev, created]);
      } else {
        const res = await fetch(`${base}/${editing}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            priceAmount: form.priceAmount,
            currency: form.currency,
            inventoryTotal: form.inventoryTotal,
            minPerOrder: form.minPerOrder,
            maxPerOrder: form.maxPerOrder,
            isTransferable: form.isTransferable,
            isRefundable: form.isRefundable,
            saleStartsAt: form.saleStartsAt ? new Date(form.saleStartsAt).toISOString() : undefined,
            saleEndsAt: form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : undefined,
          }),
        });
        if (!res.ok) { setError(await extractError(res)); return; }
        const updated = (await res.json()) as TierResponse;
        setTiers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }

      setEditing(null);
      router.refresh();
    });

  const deleteTier = (tierId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/tiers/${tierId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
      router.refresh();
    });

  const fmtMoney = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;

  return (
    <section className="mt-8">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Ticket tiers ({tiers.length})
        </h2>
        {editing === null && (
          <Button
            type="button"
            size="sm"
            onClick={startAdd}
          >
            + Add tier
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Tier list */}
      <ul className="mt-3 space-y-2">
        {tiers.map((t) =>
          editing === t.id ? null : (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div>
                <p className="font-semibold">{t.name}</p>
                {t.description && <p className="text-xs text-neutral-500">{t.description}</p>}
                <p className="text-xs text-neutral-500">
                  {t.inventoryAvailable} of {t.inventoryTotal} available · {t.inventorySold} sold
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {t.isTransferable ? '✓ Transferable' : '✗ Not transferable'} ·{' '}
                  {t.isRefundable ? '✓ Refundable' : '✗ Not refundable'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{fmtMoney(t.priceAmount, t.currency)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(t)}
                >
                  Edit
                </Button>
                {t.inventorySold === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Delete tier "${t.name}"?`)) deleteTier(t.id);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>

      {/* Inline form (add or edit) */}
      {editing !== null && (
        <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <h3 className="text-sm font-semibold">
            {editing === 'new' ? 'Add new tier' : 'Edit tier'}
          </h3>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VIP"
                />
              </div>
              <div>
                <Label className="mb-1">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1">Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.priceAmount}
                  onChange={(e) => setForm({ ...form, priceAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="mb-1">Currency</Label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as 'JMD' | 'USD' })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="JMD">JMD</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <Label className="mb-1">Inventory</Label>
                <Input
                  type="number"
                  value={form.inventoryTotal}
                  onChange={(e) => setForm({ ...form, inventoryTotal: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Min per order</Label>
                <Input
                  type="number"
                  value={form.minPerOrder}
                  onChange={(e) => setForm({ ...form, minPerOrder: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="mb-1">Max per order</Label>
                <Input
                  type="number"
                  value={form.maxPerOrder}
                  onChange={(e) => setForm({ ...form, maxPerOrder: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Sale starts at</Label>
                <DateTimePicker
                  clearable
                  placeholder="Optional"
                  value={form.saleStartsAt}
                  onChange={(v) => setForm({ ...form, saleStartsAt: v })}
                />
              </div>
              <div>
                <Label className="mb-1">Sale ends at</Label>
                <DateTimePicker
                  clearable
                  placeholder="Optional"
                  value={form.saleEndsAt}
                  onChange={(v) => setForm({ ...form, saleEndsAt: v })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isTransferable}
                  onChange={(e) => setForm({ ...form, isTransferable: e.target.checked })}
                />
                Transferable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isRefundable}
                  onChange={(e) => setForm({ ...form, isRefundable: e.target.checked })}
                />
                Refundable
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={save}
              disabled={pending || !form.name}
            >
              {pending ? 'Saving…' : editing === 'new' ? 'Add tier' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
