'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QrCodeImage from '@/components/ui/QrCodeImage';
import TransferModal from '@/components/tickets/TransferModal';
import RefundModal from '@/components/tickets/RefundModal';
import { CalendarDays, MapPin, Loader2, Ticket } from 'lucide-react';
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/datetime';

interface MyTicket {
  id: string;
  status: string;
  tierId: string;
  tierName: string;
  holderName: string;
  qrPayload: string;
  order: {
    orderNumber: string;
    eventId: string;
    eventName: string;
    eventSlug: string;
    eventStartsAt: string;
    venueName: string;
  };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function MyTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferTicket, setTransferTicket] = useState<MyTicket | null>(null);
  const [refundTicket, setRefundTicket] = useState<MyTicket | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?next=/me/tickets');
  }, [status, router]);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    fetch(`${getApiBaseUrl()}/api/v1/me/tickets`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<MyTicket[]>;
      })
      .then(setTickets)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const upcoming = tickets.filter((t) => new Date(t.order.eventStartsAt) > new Date());
  const past = tickets.filter((t) => new Date(t.order.eventStartsAt) <= new Date());

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading your tickets…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
            <p className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/me">← Account</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Browse Events</Link>
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load tickets: {error}
        </div>
      )}

      {tickets.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse upcoming events and get your first ticket!
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onTransfer={() => setTransferTicket(t)}
                onRefund={() => setRefundTicket(t)}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Past ({past.length})
          </h2>
          <div className="space-y-4 opacity-70">
            {past.map((t) => (
              <TicketCard key={t.id} ticket={t} past />
            ))}
          </div>
        </section>
      )}

      {transferTicket && (
        <TransferModal
          ticket={transferTicket}
          onClose={() => setTransferTicket(null)}
          onSuccess={() => {
            setTransferTicket(null);
            setTickets((prev) => prev.filter((t) => t.id !== transferTicket.id));
          }}
          accessToken={session?.accessToken ?? ''}
        />
      )}

      {refundTicket && (
        <RefundModal
          ticket={refundTicket}
          onClose={() => setRefundTicket(null)}
          onSuccess={() => {
            setRefundTicket(null);
            setTickets((prev) => prev.filter((t) => t.id !== refundTicket.id));
          }}
          accessToken={session?.accessToken ?? ''}
        />
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  past,
  onTransfer,
  onRefund,
}: {
  ticket: MyTicket;
  past?: boolean;
  onTransfer?: () => void;
  onRefund?: () => void;
}) {
  const [showQr, setShowQr] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{ticket.order.eventName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{ticket.tierName}</p>
            </div>
            <Badge
              variant="secondary"
              className={
                ticket.status === 'Active'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100 shrink-0'
                  : ticket.status === 'Redeemed'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-100 shrink-0'
                    : 'shrink-0'
              }
            >
              {ticket.status}
            </Badge>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {new Date(ticket.order.eventStartsAt).toLocaleString(DEFAULT_LOCALE, {
                timeZone: DEFAULT_TIMEZONE,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {ticket.order.venueName}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQr((v) => !v)}
            >
              {showQr ? 'Hide QR' : 'Show QR'}
            </Button>
            {!past && ticket.status === 'Active' && (
              <>
                {onTransfer && (
                  <Button variant="ghost" size="sm" onClick={onTransfer}>
                    Transfer
                  </Button>
                )}
                {onRefund && (
                  <Button variant="ghost" size="sm" onClick={onRefund} className="text-destructive hover:text-destructive">
                    Request Refund
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/events/${ticket.order.eventSlug}`}>Event Details</Link>
            </Button>
          </div>
        </div>

        {showQr && (
          <div className="border-t flex flex-col items-center py-6 bg-white">
            <QrCodeImage value={ticket.qrPayload} size={220} />
            <p className="text-xs text-muted-foreground mt-3">
              Holder: <span className="font-medium">{ticket.holderName}</span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              #{ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
