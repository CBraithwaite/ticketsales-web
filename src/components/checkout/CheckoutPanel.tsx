'use client';

import { useState } from 'react';
import type { EventDetail, TierResponse } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Minus, Plus, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import WaitlistButton from './WaitlistButton';

interface Props {
  event: EventDetail;
}

const FEE_PERCENT = 10;

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CheckoutPanel({ event }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const eventStarted = new Date(event.startsAt) <= now;

  const adjustQty = (tier: TierResponse, delta: number) => {
    setQuantities((prev) => {
      const current = prev[tier.id] ?? 0;
      const next = Math.min(
        Math.max(current + delta, 0),
        Math.min(tier.maxPerOrder, tier.inventoryAvailable),
      );
      if (next === 0) {
        const { [tier.id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [tier.id]: next };
    });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const selectedTierIds = Object.keys(quantities).filter((id) => (quantities[id] ?? 0) > 0);
  const currency =
    selectedTierIds.length > 0
      ? (event.tiers.find((t) => t.id === selectedTierIds[0])?.currency ?? 'JMD')
      : (event.tiers[0]?.currency ?? 'JMD');

  const subtotal = event.tiers.reduce((sum, tier) => sum + tier.priceAmount * (quantities[tier.id] ?? 0), 0);
  const fees = Math.round(subtotal * (FEE_PERCENT / 100) * 100) / 100;
  const total = subtotal + fees;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTickets === 0) return;
    setLoading(true);
    setError(null);

    try {
      const lines = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([tierId, quantity]) => ({ tierId, quantity }));

      const reserveRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          lines,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          buyerPhone: buyerPhone.trim(),
        }),
      });

      if (!reserveRes.ok) {
        const body = await reserveRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Reservation failed (${reserveRes.status})`);
      }

      const reservation = await reserveRes.json() as { orderNumber: string; confirmationToken: string };

      const sessionRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/stripe-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: reservation.orderNumber,
          confirmationToken: reservation.confirmationToken,
        }),
      });

      if (!sessionRes.ok) {
        const body = await sessionRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Payment session failed (${sessionRes.status})`);
      }

      const { checkoutUrl } = await sessionRes.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Card className="sticky top-20">
      <CardContent className="p-5">
        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Get Tickets</h2>
          </div>

          <ul className="space-y-3">
            {event.tiers.map((tier) => {
              const soldOut = tier.inventoryAvailable <= 0;
              const onSaleYet = tier.saleStartsAt ? new Date(tier.saleStartsAt) > now : false;
              const saleEnded = tier.saleEndsAt ? new Date(tier.saleEndsAt) < now : false;
              const unavailable = soldOut || onSaleYet || saleEnded || eventStarted;
              const qty = quantities[tier.id] ?? 0;

              return (
                <li key={tier.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{tier.name}</p>
                      {tier.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap shrink-0">
                      {fmt(tier.priceAmount, tier.currency)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {soldOut
                        ? 'Sold out'
                        : onSaleYet
                          ? 'Not on sale yet'
                          : saleEnded
                            ? 'Sale ended'
                            : eventStarted
                              ? 'Event started'
                              : `${tier.inventoryAvailable} available`}
                    </span>
                    {!unavailable && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={qty === 0}
                          onClick={() => adjustQty(tier, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{qty}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={qty >= Math.min(tier.maxPerOrder, tier.inventoryAvailable)}
                          onClick={() => adjustQty(tier, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {soldOut && !eventStarted && (
                    <WaitlistButton eventId={event.id} tierId={tier.id} tierName={tier.name} />
                  )}
                </li>
              );
            })}
          </ul>

          {totalTickets > 0 && (
            <>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalTickets} ticket{totalTickets !== 1 ? 's' : ''})</span>
                  <span>{fmt(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service fee ({FEE_PERCENT}%)</span>
                  <span>{fmt(fees, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1.5 mt-1">
                  <span>Total</span>
                  <span>{fmt(total, currency)}</span>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Your details</p>
                <div>
                  <Label htmlFor="checkout-name" className="text-xs">Full name *</Label>
                  <Input
                    id="checkout-name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-email" className="text-xs">Email *</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-phone" className="text-xs">Phone number *</Label>
                  <Input
                    id="checkout-phone"
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+1 876 555 0100"
                    required
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  `Pay ${fmt(total, currency)}`
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secured by Stripe. Your card is not stored.
              </p>
            </>
          )}

          {totalTickets === 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Select tickets above to continue
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
