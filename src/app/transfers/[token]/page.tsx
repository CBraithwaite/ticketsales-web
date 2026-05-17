'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QrCodeImage from '@/components/ui/QrCodeImage';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface TransferInfo {
  eventName: string;
  tierName: string;
  fromHolderName: string;
  expiresAt: string;
}

interface AcceptResult {
  ticketId: string;
  tierName: string;
  holderName: string;
  qrPayload: string;
  orderNumber: string;
  confirmationToken: string;
}

export default function TransferAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [info, setInfo] = useState<TransferInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState<AcceptResult | null>(null);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/v1/transfers/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Transfer link not found or already used.' : `Error (${r.status})`);
        return r.json() as Promise<TransferInfo>;
      })
      .then(setInfo)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load transfer'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/transfers/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Failed to accept (${res.status})`);
      }
      const data = (await res.json()) as AcceptResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading transfer…</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">Transfer Unavailable</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button asChild>
          <Link href="/">Browse Events</Link>
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Ticket Accepted!</h1>
          <p className="text-muted-foreground mt-1">The ticket has been transferred to you.</p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col items-center py-6 bg-white">
              <QrCodeImage value={result.qrPayload} size={220} />
              <p className="text-sm font-medium mt-3">{result.tierName}</p>
              <p className="text-xs text-muted-foreground">Holder: {result.holderName}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                #{result.ticketId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-2">
          <Button className="w-full" asChild>
            <Link
              href={`/checkout/success?order=${result.orderNumber}&token=${result.confirmationToken}`}
            >
              View Full Order
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/me/tickets">My Tickets</Link>
          </Button>
        </div>
      </div>
    );
  }

  const expiry = info ? new Date(info.expiresAt) : null;
  const expired = expiry ? expiry < new Date() : false;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">You&apos;ve been sent a ticket</h1>

      <Card className="mb-6">
        <CardContent className="p-5 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
            <p className="font-semibold mt-0.5">{info?.eventName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Ticket type</p>
            <p className="font-medium text-sm mt-0.5">{info?.tierName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
            <p className="font-medium text-sm mt-0.5">{info?.fromHolderName}</p>
          </div>
          {expiry && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Offer expires</p>
              <p className="font-medium text-sm mt-0.5">
                {expiry.toLocaleString('en-JM', { timeZone: 'America/Jamaica' })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {expired ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive mb-4">
          This transfer link has expired.
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          Accept the ticket below. The sender&apos;s QR code will be invalidated and a new one
          issued to you.
        </p>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleAccept}
        disabled={accepting || expired}
      >
        {accepting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting…
          </>
        ) : (
          'Accept Ticket'
        )}
      </Button>
    </div>
  );
}
