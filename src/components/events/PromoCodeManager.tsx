'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import type { PromoCodeResponse, TierResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Props {
  eventId: string;
  promoCodes: PromoCodeResponse[];
  tiers: TierResponse[];
}

interface PromoFormData {
  code: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  discountCurrency: 'JMD' | 'USD';
  maxUses: string;
  validFrom: string;
  validUntil: string;
  applicableTierIds: string[];
}

const emptyForm: PromoFormData = {
  code: '',
  discountType: 'Percentage',
  discountValue: 0,
  discountCurrency: 'JMD',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  applicableTierIds: [],
};

function promoToForm(p: PromoCodeResponse): PromoFormData {
  return {
    code: p.code,
    discountType: p.discountType,
    discountValue: p.discountValue,
    discountCurrency: (p.discountCurrency as 'JMD' | 'USD') ?? 'JMD',
    maxUses: p.maxUses != null ? String(p.maxUses) : '',
    validFrom: p.validFrom ? p.validFrom.slice(0, 16) : '',
    validUntil: p.validUntil ? p.validUntil.slice(0, 16) : '',
    applicableTierIds: p.applicableTiers.map((t) => t.tierId),
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

export default function PromoCodeManager({ eventId, promoCodes: initial, tiers }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [promoCodes, setPromoCodes] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // promo id or 'new'
  const [form, setForm] = useState<PromoFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const startAdd = () => {
    setEditing('new');
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (p: PromoCodeResponse) => {
    setEditing(p.id);
    setForm(promoToForm(p));
    setError(null);
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      maxUses: form.maxUses ? parseInt(form.maxUses) || null : null,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      applicableTierIds: form.applicableTierIds.length > 0 ? form.applicableTierIds : [],
    };
    if (form.discountType === 'FixedAmount') {
      payload.discountCurrency = form.discountCurrency;
    }
    return payload;
  };

  const save = () =>
    start(async () => {
      setError(null);
      const base = `${getApiBaseUrl()}/api/v1/events/${eventId}/promos`;

      if (editing === 'new') {
        const res = await fetch(base, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) { setError(await extractError(res)); return; }
        const created = (await res.json()) as PromoCodeResponse;
        setPromoCodes((prev) => [...prev, created]);
      } else {
        const res = await fetch(`${base}/${editing}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) { setError(await extractError(res)); return; }
        const updated = (await res.json()) as PromoCodeResponse;
        setPromoCodes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }

      setEditing(null);
      router.refresh();
    });

  const deletePromo = (promoId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/promos/${promoId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      setPromoCodes((prev) => prev.filter((p) => p.id !== promoId));
      router.refresh();
    });

  const toggleActive = (promo: PromoCodeResponse) =>
    start(async () => {
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/promos/${promo.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (!res.ok) { setError(await extractError(res)); return; }
      const updated = (await res.json()) as PromoCodeResponse;
      setPromoCodes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      router.refresh();
    });

  const toggleTier = (tierId: string) => {
    setForm((prev) => ({
      ...prev,
      applicableTierIds: prev.applicableTierIds.includes(tierId)
        ? prev.applicableTierIds.filter((id) => id !== tierId)
        : [...prev.applicableTierIds, tierId],
    }));
  };

  const fmtDiscount = (p: PromoCodeResponse) =>
    p.discountType === 'Percentage'
      ? `${p.discountValue}%`
      : `${p.discountCurrency ?? 'JMD'} ${p.discountValue.toLocaleString('en-JM')} off`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-JM', {
      timeZone: 'America/Jamaica',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const statusBadge = (p: PromoCodeResponse) => {
    if (!p.isActive) return <Badge className="bg-neutral-100 text-neutral-600 hover:bg-neutral-100">Inactive</Badge>;
    if (p.isCurrentlyValid) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>;
    // Active but not currently valid → expired or outside window
    if (p.validUntil && new Date(p.validUntil) < new Date()) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Invalid</Badge>;
  };

  return (
    <section className="mt-8">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Promo codes ({promoCodes.length})
        </h2>
        {editing === null && (
          <Button type="button" size="sm" onClick={startAdd}>
            + Add promo code
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Promo code list */}
      {promoCodes.length === 0 && editing === null ? (
        <p className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
          No promo codes created yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {promoCodes.map((p) =>
            editing === p.id ? null : (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold font-mono uppercase">{p.code}</p>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {fmtDiscount(p)}
                    </Badge>
                    {statusBadge(p)}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {p.maxUses != null
                      ? `${p.currentUses} / ${p.maxUses} used`
                      : `${p.currentUses} used (unlimited)`}
                  </p>
                  {(p.validFrom || p.validUntil) && (
                    <p className="text-xs text-neutral-400">
                      {p.validFrom && <>From {fmtDate(p.validFrom)}</>}
                      {p.validFrom && p.validUntil && <> — </>}
                      {p.validUntil && <>Until {fmtDate(p.validUntil)}</>}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400">
                    {p.applicableTiers.length > 0
                      ? `Tiers: ${p.applicableTiers.map((t) => t.tierName).join(', ')}`
                      : 'All tiers'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(p)}
                    disabled={pending}
                  >
                    {p.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </Button>
                  {p.currentUses === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Delete promo code "${p.code}"?`)) deletePromo(p.id);
                      }}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {/* Inline form (add or edit) */}
      {editing !== null && (
        <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <h3 className="text-sm font-semibold">
            {editing === 'new' ? 'Add new promo code' : 'Edit promo code'}
          </h3>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1">Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EARLYBIRD20"
                  className="font-mono uppercase"
                />
              </div>
              <div>
                <Label className="mb-1">Discount type</Label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value as 'Percentage' | 'FixedAmount' })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Percentage">Percentage</option>
                  <option value="FixedAmount">Fixed Amount</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="mb-1">Discount value</Label>
                <Input
                  type="number"
                  step={form.discountType === 'Percentage' ? '1' : '0.01'}
                  min="0"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {form.discountType === 'FixedAmount' && (
                <div>
                  <Label className="mb-1">Currency</Label>
                  <select
                    value={form.discountCurrency}
                    onChange={(e) =>
                      setForm({ ...form, discountCurrency: e.target.value as 'JMD' | 'USD' })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="JMD">JMD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              )}
              <div>
                <Label className="mb-1">Max uses (0 = unlimited)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1">Valid from</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1">Valid until</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>
            </div>

            {tiers.length > 0 && (
              <div>
                <Label className="mb-1">Applicable tiers (none selected = all tiers)</Label>
                <div className="mt-1 flex flex-wrap gap-3">
                  {tiers.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.applicableTierIds.includes(t.id)}
                        onChange={() => toggleTier(t.id)}
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={save}
              disabled={pending || !form.code.trim() || form.discountValue <= 0}
            >
              {pending ? 'Saving…' : editing === 'new' ? 'Add promo code' : 'Save changes'}
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
