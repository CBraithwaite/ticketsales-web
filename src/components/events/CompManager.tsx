'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Mail, MessageCircle, Plus, X, Check, ExternalLink } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  inventoryAvailable: number;
}

interface CompSummary {
  orderNumber: string;
  recipientName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  quantity: number;
  tierNames: string[];
  issuedAt: string;
  source: 'organizer' | 'door';
}

interface IssueCompResponse {
  orderNumber: string;
  confirmationToken: string;
  recipientName: string;
  tierName: string;
  quantity: number;
  sentVia: string[];
  viewUrl: string;
}

interface Props {
  eventId: string;
  tiers: Tier[];
  comps: CompSummary[];
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-JM', {
    timeZone: 'America/Jamaica',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function CompManager({ eventId, tiers, comps: initialComps }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [comps, setComps] = useState<CompSummary[]>(initialComps);

  // Form state
  const [tierId, setTierId] = useState(tiers[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [recipientWhatsApp, setRecipientWhatsApp] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastIssued, setLastIssued] = useState<IssueCompResponse | null>(null);

  const resetForm = () => {
    setTierId(tiers[0]?.id ?? '');
    setQuantity(1);
    setRecipientName('');
    setRecipientWhatsApp('');
    setRecipientEmail('');
    setRecipientPhone('');
    setSubmitError(null);
    setLastIssued(null);
  };

  const submit = async () => {
    if (!session?.accessToken || !tierId) return;
    if (!recipientWhatsApp.trim() && !recipientEmail.trim()) {
      setSubmitError('Provide at least a WhatsApp number or email so the recipient can receive their ticket.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/comps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          tierId,
          quantity,
          recipientName: recipientName.trim() || 'Guest',
          recipientPhone: recipientPhone.trim() || null,
          recipientEmail: recipientEmail.trim() || null,
          recipientWhatsApp: recipientWhatsApp.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setSubmitError(body.error ?? `Failed (${res.status})`);
        return;
      }

      const data = await res.json() as IssueCompResponse;
      setLastIssued(data);

      // Refresh comp list without full page reload
      startTransition(() => router.refresh());
      const refreshed = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/comps`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (refreshed.ok) {
        const updated = await refreshed.json() as CompSummary[];
        setComps(updated);
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalComps = comps.reduce((s, c) => s + c.quantity, 0);
  const organizerComps = comps.filter((c) => c.source === 'organizer').reduce((s, c) => s + c.quantity, 0);
  const doorComps = comps.filter((c) => c.source === 'door').reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="mt-8">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-base">Complementary Tickets</h3>
          {totalComps > 0 && (
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              {totalComps} issued
            </Badge>
          )}
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => { setShowForm(true); setLastIssued(null); }}>
            <Plus className="h-4 w-4 mr-1" /> Issue Comp
          </Button>
        )}
      </div>

      {/* Issue form */}
      {showForm && (
        <div className="rounded-lg border bg-purple-50/50 p-4 mb-4">
          {lastIssued ? (
            // Success state
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <p className="font-semibold">Comp issued — {lastIssued.orderNumber}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {lastIssued.quantity}× {lastIssued.tierName} → <span className="font-medium">{lastIssued.recipientName}</span>
              </p>
              {lastIssued.sentVia.length > 0 ? (
                <p className="text-xs text-green-700">
                  Delivered via {lastIssued.sentVia.join(' + ')}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-amber-700">No delivery method — share this link with the recipient:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white border rounded px-2 py-1 flex-1 truncate">{lastIssued.viewUrl}</code>
                    <a href={lastIssued.viewUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => { resetForm(); }}>
                  Issue Another
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            // Input form
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">New complementary ticket</p>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tier</Label>
                  <select
                    value={tierId}
                    onChange={(e) => setTierId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.inventoryAvailable} left)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Recipient name</Label>
                <Input
                  placeholder="Jane Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-9"
                />
              </div>

              <p className="text-xs font-medium text-muted-foreground">Delivery — provide at least one</p>

              <div className="grid gap-2">
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="WhatsApp number (e.g. +18761234567)"
                    value={recipientWhatsApp}
                    onChange={(e) => setRecipientWhatsApp(e.target.value)}
                    className="h-9 pl-9"
                    inputMode="tel"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Email address (fallback)"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="h-9 pl-9"
                    inputMode="email"
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={submit}
                disabled={submitting || !tierId}
              >
                {submitting ? 'Issuing…' : `Issue ${quantity} Comp Ticket${quantity !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Comp list */}
      {comps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comp tickets issued yet.
        </p>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Recipient</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Source</span>
            <span className="text-right">Issued</span>
          </div>
          {comps.map((c) => (
            <div
              key={c.orderNumber}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center rounded-md px-2 py-2 text-sm hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.recipientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.tierNames.join(', ')}
                  {c.contactEmail && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Mail className="h-3 w-3" />{c.contactEmail}
                    </span>
                  )}
                  {c.contactPhone && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" />{c.contactPhone}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-right tabular-nums">{c.quantity}</span>
              <span className="text-right">
                <Badge className={c.source === 'door'
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                }>
                  {c.source === 'door' ? 'Door' : 'Organizer'}
                </Badge>
              </span>
              <span className="text-right text-xs text-muted-foreground whitespace-nowrap">{fmt(c.issuedAt)}</span>
            </div>
          ))}
          {(organizerComps > 0 || doorComps > 0) && (
            <div className="pt-2 flex gap-4 text-xs text-muted-foreground px-2">
              {organizerComps > 0 && <span>{organizerComps} via organizer</span>}
              {doorComps > 0 && <span>{doorComps} via door</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
