'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EventDetail, TierResponse, BankTransferReserveResponse, PaymentMethods } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Ticket, Minus, Plus, Loader2, LogIn,
  CreditCard, Building2, Copy, CheckCircle2, Clock, Wallet, Search,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { estimateFeeParts, FEE_PERCENT } from '@/lib/fees';
import { fmtShort, fmtTime, fmtDateTime, DEFAULT_LOCALE } from '@/lib/datetime';
import WaitlistButton from './WaitlistButton';
import type { OccurrenceResponse } from '@/types/api';

interface Props {
  event: EventDetail;
  /** Which payment methods the server has enabled. Omitted = assume all (back-compat). */
  methods?: PaymentMethods;
}

const METHOD_META = {
  card: { label: 'Card', Icon: CreditCard },
  wipay: { label: 'WiPay', Icon: Wallet },
  bank: { label: 'Bank', Icon: Building2 },
} as const;

const fmtOccurrence = (startIso: string, endIso: string, timeZone: string) => {
  const start = fmtShort(startIso, timeZone);
  const end = fmtTime(endIso, timeZone);
  return `${start} – ${end}`;
};

type PaymentMethod = 'card' | 'wipay' | 'bank';
type BankStep = 'form' | 'instructions';

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BuyerSchema = z.object({
  buyerName: z.string().min(1, 'Name is required'),
  buyerEmail: z.string().email('Enter a valid email address'),
  buyerPhone: z.string().min(1, 'Phone number is required'),
});
type BuyerFormValues = z.infer<typeof BuyerSchema>;

const formatPhoneDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 15);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
};

const normalizePhone = (p: string): string => {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 8) return `+${digits}`;
  return p.trim();
};

export default function CheckoutPanel({ event, methods }: Props) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthed = status === 'authenticated';

  // Only offer payment methods the server actually has configured. If the prop
  // is missing, assume all are available (keeps older callers working).
  const enabledMethods = methods ?? { card: true, wiPay: true, bank: true };
  const availableMethods = ([
    enabledMethods.card && 'card',
    enabledMethods.wiPay && 'wipay',
    enabledMethods.bank && 'bank',
  ].filter(Boolean) as PaymentMethod[]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(availableMethods[0] ?? 'card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankResult, setBankResult] = useState<BankTransferReserveResponse | null>(null);
  const [bankStep, setBankStep] = useState<BankStep>('form');
  const [copied, setCopied] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(BuyerSchema),
    defaultValues: { buyerName: '', buyerEmail: '', buyerPhone: '' },
  });

  useEffect(() => {
    if (session?.user) {
      if (!form.getValues('buyerName')) {
        form.setValue('buyerName', session.user.fullName ?? session.user.name ?? '');
      }
      if (!form.getValues('buyerEmail')) {
        form.setValue('buyerEmail', session.user.email ?? '');
      }
    }
  }, [session, form]);

  const now = new Date();
  const eventStarted = new Date(event.startsAt) <= now;

  const isSeries = event.type === 'Series' && !!event.occurrences;
  const allTiers = isSeries ? event.occurrences!.flatMap((o) => o.tiers) : event.tiers;

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
      ? (allTiers.find((t) => t.id === selectedTierIds[0])?.currency ?? 'JMD')
      : (allTiers[0]?.currency ?? 'JMD');

  const subtotal = allTiers.reduce((sum, tier) => sum + tier.priceAmount * (quantities[tier.id] ?? 0), 0);
  const feeParts = estimateFeeParts(subtotal, totalTickets, currency);
  const total = subtotal + feeParts.total;

  // Series: upcoming, still-scheduled dates only (past dates can't be bought).
  const scheduledOccurrences: OccurrenceResponse[] = isSeries
    ? event.occurrences!.filter((o) => o.status === 'Scheduled' && new Date(o.startsAt) > now)
    : [];
  const q = dateQuery.trim().toLowerCase();
  const filteredOccurrences = scheduledOccurrences.filter((o) => {
    if (onlyAvailable && o.remainingInventory <= 0) return false;
    if (!q) return true;
    return `${o.label ?? ''} ${fmtOccurrence(o.startsAt, o.endsAt, event.timeZone)}`.toLowerCase().includes(q);
  });

  const occSelectedCount = (o: OccurrenceResponse) =>
    o.tiers.reduce((s, t) => s + (quantities[t.id] ?? 0), 0);

  // A date is open if the buyer explicitly toggled it, else auto-open when it has a
  // selection, the buyer is searching, or there's only one date to show.
  const isDateOpen = (o: OccurrenceResponse) =>
    expandedDates[o.id] ??
    (occSelectedCount(o) > 0 || q.length > 0 || filteredOccurrences.length === 1);
  const toggleDate = (o: OccurrenceResponse) =>
    setExpandedDates((prev) => ({ ...prev, [o.id]: !isDateOpen(o) }));

  // Per-date breakdown of what's in the cart (independent of the current search filter).
  const selectionByDate = scheduledOccurrences
    .map((o) => ({
      occ: o,
      lines: o.tiers
        .filter((t) => (quantities[t.id] ?? 0) > 0)
        .map((t) => ({ name: t.name, qty: quantities[t.id], amount: t.priceAmount, currency: t.currency })),
    }))
    .filter((x) => x.lines.length > 0);

  const renderTier = (tier: TierResponse, started: boolean) => {
    const soldOut = tier.inventoryAvailable <= 0;
    const onSaleYet = tier.saleStartsAt ? new Date(tier.saleStartsAt) > now : false;
    const saleEnded = tier.saleEndsAt ? new Date(tier.saleEndsAt) < now : false;
    const unavailable = soldOut || onSaleYet || saleEnded || started;
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
              : started ? 'Date passed'
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
        {soldOut && !started && (
          <WaitlistButton eventId={event.id} tierId={tier.id} tierName={tier.name} />
        )}
      </li>
    );
  };

  const extractError = async (res: Response, fallback: string): Promise<string> => {
    const body = await res.json().catch(() => ({})) as {
      error?: string;
      errors?: Record<string, string[]>;
    };
    if (body.error) return body.error;
    if (body.errors) {
      const first = Object.values(body.errors).flat()[0];
      if (first) return first;
    }
    return fallback;
  };

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.accessToken) h['Authorization'] = `Bearer ${session.accessToken}`;
    return h;
  };

  const reservePayload = (buyer: BuyerFormValues) => ({
    eventId: event.id,
    lines: Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity })),
    buyerName: buyer.buyerName.trim(),
    buyerEmail: buyer.buyerEmail.trim().toLowerCase(),
    buyerPhone: normalizePhone(buyer.buyerPhone),
  });

  const handleCardCheckout = async (buyer: BuyerFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const reserveRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/reserve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reservePayload(buyer)),
      });

      if (!reserveRes.ok) {
        throw new Error(await extractError(reserveRes, `Reservation failed (${reserveRes.status})`));
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
        throw new Error(await extractError(sessionRes, `Payment session failed (${sessionRes.status})`));
      }

      const { checkoutUrl } = await sessionRes.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleWiPayCheckout = async (buyer: BuyerFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const reserveRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/reserve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reservePayload(buyer)),
      });

      if (!reserveRes.ok) {
        throw new Error(await extractError(reserveRes, `Reservation failed (${reserveRes.status})`));
      }

      const reservation = await reserveRes.json() as { orderNumber: string; confirmationToken: string };

      const sessionRes = await fetch(`${getApiBaseUrl()}/api/v1/checkout/wipay-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: reservation.orderNumber,
          confirmationToken: reservation.confirmationToken,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error(await extractError(sessionRes, `Payment session failed (${sessionRes.status})`));
      }

      const { checkoutUrl } = await sessionRes.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleBankTransfer = async (buyer: BuyerFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/checkout/bank-transfer`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reservePayload(buyer)),
      });

      if (!res.ok) {
        throw new Error(await extractError(res, `Reservation failed (${res.status})`));
      }

      const data = await res.json() as BankTransferReserveResponse;
      setSubmittedEmail(buyer.buyerEmail.trim().toLowerCase());
      setBankResult(data);
      setBankStep('instructions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (buyer: BuyerFormValues) => {
    if (totalTickets === 0) return;
    if (paymentMethod === 'card') handleCardCheckout(buyer);
    else if (paymentMethod === 'wipay') handleWiPayCheckout(buyer);
    else handleBankTransfer(buyer);
  };

  const copyMemo = () => {
    if (!bankResult) return;
    navigator.clipboard.writeText(bankResult.paymentMemo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Bank transfer instructions view
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
                {fmtDateTime(bankResult.expiresAt, event.timeZone)}
              </span>.
              Transfer before this time to secure your tickets.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Order <span className="font-mono">{bankResult.orderNumber}</span> · Confirmation email sent to {submittedEmail}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20">
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Get Tickets</h2>
            </div>

            {/* Single-date: flat tier list */}
            {!isSeries && (
              <ul className="space-y-3">
                {event.tiers.map((tier) => renderTier(tier, eventStarted))}
              </ul>
            )}

            {/* Series: searchable, collapsible date list — each date holds its own tiers */}
            {isSeries && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {scheduledOccurrences.length} upcoming date{scheduledOccurrences.length !== 1 ? 's' : ''}
                  {' · '}pick one or more
                </p>

                {scheduledOccurrences.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search dates"
                      className="h-9 pl-8"
                      value={dateQuery}
                      onChange={(e) => setDateQuery(e.target.value)}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-input"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                  />
                  Only show dates with tickets available
                </label>

                {filteredOccurrences.map((occ) => {
                  const open = isDateOpen(occ);
                  const selected = occSelectedCount(occ);
                  const soldOut = occ.remainingInventory <= 0;
                  return (
                    <div key={occ.id} className="rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleDate(occ)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {occ.label ? `${occ.label} · ` : ''}{fmtOccurrence(occ.startsAt, occ.endsAt, event.timeZone)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {soldOut
                              ? 'Sold out'
                              : `${occ.remainingInventory} left · from ${fmt(occ.lowestPriceAmount, occ.lowestPriceCurrency)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {selected > 0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              {selected}
                            </span>
                          )}
                          {open ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      {open && (
                        <ul className="space-y-2 border-t p-2">
                          {occ.tiers.map((tier) => renderTier(tier, false))}
                        </ul>
                      )}
                    </div>
                  );
                })}

                {filteredOccurrences.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-3">
                    {scheduledOccurrences.length === 0 ? 'No upcoming dates on sale.' : 'No dates match your search.'}
                  </p>
                )}
              </div>
            )}

            {totalTickets > 0 && (
              <>
                {/* Per-date breakdown (series only) */}
                {isSeries && selectionByDate.length > 0 && (
                  <div className="rounded-lg border p-3 space-y-2.5 text-sm">
                    {selectionByDate.map(({ occ, lines }) => (
                      <div key={occ.id} className="space-y-1">
                        <p className="text-xs font-semibold">
                          {occ.label ? `${occ.label} · ` : ''}{fmtOccurrence(occ.startsAt, occ.endsAt, event.timeZone)}
                        </p>
                        {lines.map((l, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span>{l.qty}× {l.name}</span>
                            <span>{fmt(l.amount * l.qty, l.currency)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Price summary */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({totalTickets} ticket{totalTickets !== 1 ? 's' : ''})</span>
                    <span>{fmt(subtotal, currency)}</span>
                  </div>
                  {feeParts.processing > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Credit card processing ({FEE_PERCENT}%)</span>
                      <span>{fmt(feeParts.processing, currency)}</span>
                    </div>
                  )}
                  {feeParts.service > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service fee</span>
                      <span>{fmt(feeParts.service, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1.5 mt-1">
                    <span>Total</span>
                    <span>{fmt(total, currency)}</span>
                  </div>
                </div>

                {/* Payment method toggle — only shown when more than one is available */}
                {availableMethods.length > 1 && (
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${availableMethods.length}, minmax(0, 1fr))` }}
                  >
                    {availableMethods.map((m) => {
                      const { label, Icon } = METHOD_META[m];
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                            paymentMethod === m
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {paymentMethod === 'wipay' && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800">
                    Pay securely via WiPay — supports credit/debit cards and online banking across the Caribbean.
                  </div>
                )}

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

                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Full name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" className="h-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" className="h-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Phone number *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="876 555 0100"
                            className="h-9"
                            {...field}
                            onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Enter your number with country code (e.g. 1 876 555 0100).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || totalTickets === 0}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                  ) : paymentMethod === 'bank' ? (
                    'Reserve & Get Bank Details'
                  ) : (
                    `Pay ${fmt(total, currency)}`
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {paymentMethod === 'card'
                    ? 'Secured by Stripe. Your card is not stored.'
                    : paymentMethod === 'wipay'
                    ? 'You will be redirected to WiPay to complete payment.'
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
        </Form>
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
