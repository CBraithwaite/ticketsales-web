'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE } from '@/lib/datetime';
import { useParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import QrCodeImage from '@/components/ui/QrCodeImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

import type { TicketViewResponse } from '@/types/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketViewPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] = useState<TicketViewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${getApiBaseUrl()}/api/v1/tickets/view/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? 'Tickets not found. Check your link and try again.' : `Error loading tickets (${res.status}).`);
          return;
        }
        setData(await res.json());
      })
      .catch(() => setError('Network error loading tickets.'));
  }, [token]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold">Oops</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading tickets…</p>
      </main>
    );
  }

  const ticket = data.tickets[activeIndex];

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center gap-5 px-4 py-8">
      {/* Header */}
      <div className="w-full text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ChoiceStubs
        </p>
        <h1 className="mt-1 text-xl font-bold">{data.eventName}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(data.eventDate)}</p>
        {data.venueName && (
          <p className="text-sm text-muted-foreground">{data.venueName}</p>
        )}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Badge variant="outline">Order #{data.orderNumber}</Badge>
          {data.isComp && <Badge variant="secondary">Comp</Badge>}
        </div>
      </div>

      {/* QR code */}
      <div className="rounded-2xl bg-white p-5 shadow-lg">
        <QrCodeImage value={ticket.qrPayload} size={240} />
      </div>

      {/* Ticket info */}
      <div className="text-center">
        <p className="text-lg font-semibold">{ticket.tierName}</p>
        {ticket.holderName && ticket.holderName !== 'Walk-up' && ticket.holderName !== 'Guest' && (
          <p className="text-sm text-muted-foreground">{ticket.holderName}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Ticket {ticket.index} of {data.totalTickets}
        </p>
      </div>

      {/* Navigation */}
      {data.totalTickets > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex((i) => i - 1)}
            disabled={activeIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {activeIndex + 1} / {data.totalTickets}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex((i) => i + 1)}
            disabled={activeIndex === data.totalTickets - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* PDF download */}
      <a
        href={`${getApiBaseUrl()}/api/v1/tickets/pdf/${token}`}
        download={`tickets-${data.orderNumber}.pdf`}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Download className="h-4 w-4" /> Download PDF
      </a>

      {/* Footer instruction */}
      <p className="mt-auto text-center text-xs text-muted-foreground">
        Screenshot or save each QR code. Present it at the gate to enter.
      </p>
    </main>
  );
}
