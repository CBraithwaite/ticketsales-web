'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { EventDetail, TierResponse, BankTransferReserveResponse } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Ticket, Minus, Plus, Loader2, LogIn,
  CreditCard, Building2, Copy, CheckCircle2, Clock,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import WaitlistButton from './WaitlistButton';

interface Props {
  event: EventDetail;
}

type PaymentMethod = 'card' | 'bank';
type BankStep = 'form' | 'instructions';

const FEE_PERCENT = 10;

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CheckoutPanel({ event }: Props) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthed = status === 'authenticated';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankResult, setBankResult] = useState<BankTransferReserveResponse | null>(null);
  const [bankStep, setBankStep] = useState<BankStep>('form');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setBuyerName((prev) => prev || (session.user.fullName ?? session.user.name ?? ''));
      setBuyerEmail((prev) => prev || (session.user.email ?? ''));
    }
  }, [session]);

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

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.accessToken) h['Authorization'] = `Bearer ${session.accessToken}`;
    return h;
  };

  const reservePayload = () => ({
    eventId: event.id,
    lines: Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity })),
    buyerName: buyerName.trim(),
    buyerEmail: buyerEmail.trim().toLowerCase(),
    buyerPhone: buyerPhone.trim(),
  });

  const handleCardCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTickets === 0) return;
    setLoading(true);
    setError(null);

    try {
      const reserveRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/reserve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reservePayload()),
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

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTickets === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/checkout/bank-transfer`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reservePayload()),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Reservation failed (${res.status})`);
      }

      const data = await res.json() as BankTransferReserveResponse;
      setBankResult(data);
      setBankStep('instructions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyMemo = () => {
    if (!bankResult) return;
    navigator.clipboard.writeText(bankResult.paymentMemo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---- Bank transfer instructions view ----
  if (bankStep === 'instructions' && bankResult) {
    const bd = bankResult.bankDetails;
    return (
      <Card className="sticky top-20">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-semibold text-base">Reservation confirmed!</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Transfer <span className="font-semibold text-foreground">{fmt(bankResult.totalAmount, bankResult.currency)}</span> to
            the account below. Your tickets will be issued within 1–2 business days after we confirm receipt.
          </p>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <Row label="Bank" value={bd.bankName} />
            <Row label="Account name" value={bd.accountName} />
            <Row label="Account number" value={bd.accountNumber} />
            {bd.routingNumber && <Row label="Routing / sort code" value={bd.routingNumber} />}
            {bd.branch && <Row label="Branch" value={bd.branch} />}
          </div>

          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">Reference / Memo — <strong>required</strong></p>
            <div className="flex items-center gap-2">
              <p className="font-mono font-bold text-lg tracking-wide flex-1">{bankResult.paymentMemo}</p>
              <Button type="button" variant="outline" size="sm" onClick={copyMemo} className="shrink-0">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You <strong>must</strong> include this reference so we can match your payment.
            </p>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p>
              Reservation expires{' '}
              <span className="font-medium text-foreground">
                {new Date(bankResult.expiresAt).toLocaleString('en-JM', { timeZone: 'America/Jamaica' })}
              </span>.
              Transfer before this time to secure your tickets.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Order <span className="font-mono">{bankResult.orderNumber}</span> · Confirmation email sent to {buyerEmail}
          </p>
        </CardContent>
      </Card>
    );
  }

  const buyerDetailsValid = buyerName.trim() && buyerEmail.trim() && buyerPhone.trim();

  return (
    <Card className="sticky top-20">
      <CardContent className="p-5">
        <form
          onSubmit={paymentMethod === 'card' ? handleCardCheckout : handleBankTransfer}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Get Tickets</h2>
          </div>

          {/* Tier list */}
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
                      {soldOut ? 'Sold out'
                        : onSaleYet ? 'Not on sale yet'
                        : saleEnded ? 'Sale ended'
                        : eventStarted ? 'Event started'
                        : `${tier.inventoryAvailable} available`}
                    </span>
                    {!unavailable && (
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                          disabled={qty === 0} onClick={() => adjustQty(tier, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{qty}</span>
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                          disabled={qty >= Math.min(tier.maxPerOrder, tier.inventoryAvailable)}
                          onClick={() => adjustQty(tier, 1)}>
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
              {/* Price summary */}
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

              {/* Payment method toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                    paymentMethod === 'bank'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Bank Transfer
                </button>
              </div>

              {paymentMethod === 'bank' && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  Reserve now and pay by bank deposit. Tickets are issued within 1–2 business days after we confirm receipt.
                </div>
              )}

              {/* Buyer details */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Your details</p>
                  {!isAuthed && (
                    <Link
                      href={`/login?next=${encodeURIComponent(pathname)}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <LogIn className="h-3 w-3" />
                      Sign in to autofill
                    </Link>
                  )}
                </div>
                <div>
                  <Label htmlFor="checkout-name" className="text-xs">Full name *</Label>
                  <Input id="checkout-name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Jane Smith" required className="mt-1 h-9" />
                </div>
                <div>
                  <Label htmlFor="checkout-email" className="text-xs">Email *</Label>
                  <Input id="checkout-email" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="jane@example.com" required className="mt-1 h-9" />
                </div>
                <div>
                  <Label htmlFor="checkout-phone" className="text-xs">Phone number *</Label>
                  <Input id="checkout-phone" type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+1 876 555 0100" required className="mt-1 h-9" />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !buyerDetailsValid}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                ) : paymentMethod === 'bank' ? (
                  `Reserve & Get Bank Details`
                ) : (
                  `Pay ${fmt(total, currency)}`
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {paymentMethod === 'card'
                  ? 'Secured by Stripe. Your card is not stored.'
                  : 'Your spot is held for 24 hours after reservation.'}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
