'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import type { OrderSummary } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QrCodeImage from '@/components/ui/QrCodeImage';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Loader2, CalendarDays, MapPin, Ticket, Mail, MessageCircle, Copy, Send,
} from 'lucide-react';

import { DEFAULT_LOCALE } from '@/lib/datetime';

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleString(DEFAULT_LOCALE, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const token = searchParams.get('token') ?? '';
  const { status } = useSession();
  const isGuest = status === 'unauthenticated';

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [copied, setCopied] = useState(false);

  const emailTickets = useCallback(async () => {
    if (!orderNumber || !token) return;
    const to = emailTo.trim().toLowerCase();
    if (!to || !to.includes('@')) {
      setEmailState('error');
      setEmailMsg('Enter a valid email address.');
      return;
    }
    setEmailState('sending');
    setEmailMsg(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/orders/${encodeURIComponent(orderNumber)}/email-tickets?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: to }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEmailState('error');
        setEmailMsg(data?.error ?? `Failed to send (${res.status}).`);
        return;
      }
      const data = (await res.json()) as { sent: number; email: string };
      setEmailState('sent');
      setEmailMsg(`Sent ${data.sent} ticket${data.sent === 1 ? '' : 's'} to ${data.email}`);
    } catch {
      setEmailState('error');
      setEmailMsg('Network error. Please try again.');
    }
  }, [orderNumber, token, emailTo]);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber || !token) {
      setError('Invalid confirmation link.');
      return;
    }
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        setError(res.status === 404 ? 'Order not found.' : `Error loading order (${res.status}).`);
        return;
      }
      const data = (await res.json()) as OrderSummary;
      setOrder(data);
      setEmailTo((prev) => prev || data.buyerEmail);
    } catch {
      setError('Could not load order. Check your internet connection and refresh.');
    }
  }, [orderNumber, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll until Paid (Stripe webhook may lag by a few seconds)
  useEffect(() => {
    if (order?.status === 'Paid') return;
    if (pollCount >= 15) {
      setTimedOut(true);
      return;
    }

    const t = setTimeout(() => {
      setPollCount((c) => c + 1);
      fetchOrder();
    }, 2000);
    return () => clearTimeout(t);
  }, [order, pollCount, fetchOrder]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/">Browse Events</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your order…</p>
      </div>
    );
  }

  if (order.status === 'Pending') {
    if (timedOut) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <h2 className="text-xl font-semibold">Payment received!</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your payment was processed but ticket confirmation is taking longer than usual.
            Check your email for a confirmation, or visit <strong>My Tickets</strong> in a minute.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Button onClick={() => { setTimedOut(false); setPollCount(0); fetchOrder(); }}>
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/me/tickets">My Tickets</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium">Confirming your payment…</p>
        <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re going!</h1>
        <p className="mt-1 text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">{order.orderNumber}</span> confirmed
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          A confirmation has been sent to {order.buyerEmail}
        </p>
      </div>

      {/* Event info */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg">{order.event.name}</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{fmtDate(order.event.startsAt, order.event.timeZone)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{order.event.venueName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets with QR codes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">
            Your Ticket{order.tickets.length !== 1 ? 's' : ''} ({order.tickets.length})
          </h2>
        </div>
        {order.tickets.map((ticket, idx) => (
          <Card key={ticket.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* QR code */}
                <div className="flex items-center justify-center bg-white p-6 sm:border-r">
                  <QrCodeImage value={ticket.qrPayload} size={180} />
                </div>
                {/* Details */}
                <div className="flex flex-col justify-center p-5 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Ticket {idx + 1}</p>
                    <p className="font-semibold mt-0.5">{ticket.tierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Holder</p>
                    <p className="font-medium text-sm mt-0.5">{ticket.holderName}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-fit bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    {ticket.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {ticket.id.slice(0, 8).toUpperCase()}
                  </p>
                  <TicketSendInline ticketId={ticket.id} token={token} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order summary */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <h3 className="font-medium mb-3">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(order.subtotalAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service fee</span>
              <span>{fmt(order.feesAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1.5 mt-1">
              <span>Total paid</span>
              <span>{fmt(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email + share tickets */}
      <Card className="mt-6">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="font-medium text-sm">Email PDF tickets</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We sent them to {order.buyerEmail} automatically — re-send to any address.
            </p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              emailTickets();
            }}
          >
            <Input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address for PDF tickets"
              className="sm:max-w-xs"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={emailState === 'sending'}
              className="shrink-0"
            >
              {emailState === 'sending' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" /> Email PDF tickets</>
              )}
            </Button>
          </form>
          {emailMsg && (
            <p className={`text-xs ${emailState === 'error' ? 'text-destructive' : 'text-green-700'}`}>
              {emailMsg}
            </p>
          )}

          <div className="border-t pt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-2 bg-[#25D366] text-white hover:bg-[#1faf55] border-0"
              onClick={() => {
                const url = `${window.location.origin}/tickets/${token}`;
                const msg =
                  `🎟️ ${order.event.name}\n${order.event.venueName}\n\n` +
                  `View the ticket${order.tickets.length !== 1 ? 's' : ''} here:\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/tickets/${token}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4 text-green-600" /> Link copied</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy ticket link</>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Anyone with the link can view all QR codes on this order — each code admits one
            person, once.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/events/${order.event.slug}`}>View Event</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/me/tickets">My Tickets</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Browse More Events</Link>
        </Button>
      </div>

      {isGuest && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-center space-y-2">
            <p className="font-medium text-sm">Save your tickets to your account</p>
            <p className="text-xs text-muted-foreground">
              Create a free account with <span className="font-medium">{order.buyerEmail}</span> to manage
              transfers, request refunds, and access your tickets anytime.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href={`/signup?email=${encodeURIComponent(order.buyerEmail)}`}>
                Create free account
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Bookmark this page or visit My Tickets to access your QR codes anytime.
      </p>
    </div>
  );
}

/** Per-ticket "email this ticket to someone" — sends just that ticket's PDF. */
function TicketSendInline({ ticketId, token }: { ticketId: string; token: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  const send = async () => {
    const to = email.trim().toLowerCase();
    if (!to || !to.includes('@')) {
      setState('error');
      setMsg('Enter a valid email address.');
      return;
    }
    setState('sending');
    setMsg(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/tickets/${ticketId}/send?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: to }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState('error');
        setMsg(data?.error ?? `Failed to send (${res.status}).`);
        return;
      }
      setState('sent');
      setMsg(`Sent to ${to}`);
    } catch {
      setState('error');
      setMsg('Network error. Please try again.');
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Send className="h-3.5 w-3.5" /> Email this ticket
      </Button>
    );
  }

  return (
    <div className="space-y-1.5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          aria-label="Recipient email for this ticket"
          className="h-8 text-sm"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={state === 'sending'} className="shrink-0">
          {state === 'sending' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
        </Button>
      </form>
      {msg && (
        <p className={`text-xs ${state === 'error' ? 'text-destructive' : 'text-green-700'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
