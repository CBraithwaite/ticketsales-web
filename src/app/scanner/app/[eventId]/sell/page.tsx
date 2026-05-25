'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import QrCodeImage from '@/components/ui/QrCodeImage';
import { ArrowLeft, Minus, Plus, Gift, Banknote, Check, Mail, MessageCircle } from 'lucide-react';

interface SaleInfoTier {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  availableInventory: number;
}

interface SaleInfoResponse {
  eventId: string;
  eventName: string;
  tiers: SaleInfoTier[];
  canSellAtDoor: boolean;
  mySalesToday: number;
  myRevenueToday: number;
  currency: string;
}

interface DoorSaleTicket {
  id: string;
  tierName: string;
  holderName: string;
  qrPayload: string;
}

interface DoorSaleResponse {
  orderNumber: string;
  confirmationToken: string;
  totalAmount: number;
  currency: string;
  isComp: boolean;
  tickets: DoorSaleTicket[];
}

const fmt = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function ScannerSellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [info, setInfo] = useState<SaleInfoResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWhatsApp, setBuyerWhatsApp] = useState('');
  const [isComp, setIsComp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<DoorSaleResponse | null>(null);
  const [activeQrIndex, setActiveQrIndex] = useState(0);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?next=/scanner/app/${eventId}/sell`);
    }
  }, [status, eventId, router]);

  const fetchInfo = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/scanner/events/${eventId}/sale-info`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      if (!res.ok) {
        if (res.status === 403) setLoadError('You are not authorized to scan this event.');
        else setLoadError(`Failed to load sale info (${res.status}).`);
        return;
      }
      const data: SaleInfoResponse = await res.json();
      setInfo(data);
    } catch {
      setLoadError('Network error loading sale info.');
    }
  }, [eventId, session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) fetchInfo();
  }, [session?.accessToken, fetchInfo]);

  const setQty = (tierId: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[tierId];
      else next[tierId] = qty;
      return next;
    });
  };

  const lines = useMemo(
    () =>
      info
        ? info.tiers
            .map((t) => ({ tier: t, qty: quantities[t.id] ?? 0 }))
            .filter((l) => l.qty > 0)
        : [],
    [info, quantities],
  );

  const subtotal = lines.reduce((s, l) => s + l.tier.priceAmount * l.qty, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const currency = info?.currency ?? 'JMD';

  const submit = async () => {
    if (!session?.accessToken || lines.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/scanner/events/${eventId}/door-sale`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            lines: lines.map((l) => ({ tierId: l.tier.id, quantity: l.qty })),
            buyerName: buyerName.trim() || undefined,
            buyerPhone: buyerPhone.trim() || undefined,
            buyerEmail: buyerEmail.trim() || undefined,
            buyerWhatsApp: buyerWhatsApp.trim() || undefined,
            isComp,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body?.error ?? `Sale failed (${res.status}).`);
        return;
      }
      const data: DoorSaleResponse = await res.json();
      setLastSale(data);
      setActiveQrIndex(0);
      setQuantities({});
      setBuyerName('');
      setBuyerPhone('');
      setBuyerEmail('');
      setBuyerWhatsApp('');
      setIsComp(false);
      fetchInfo();
    } catch {
      setSubmitError('Network error completing sale.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }
  if (status === 'unauthenticated') return null;

  // ---- QR overlay after a successful sale -----------------------------------
  if (lastSale) {
    const current = lastSale.tickets[activeQrIndex];
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {lastSale.isComp ? 'Comp Issued' : 'Sale Complete'} · {lastSale.orderNumber}
        </p>
        <p className="text-sm text-muted-foreground">
          Ticket {activeQrIndex + 1} of {lastSale.tickets.length}
        </p>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <QrCodeImage value={current.qrPayload} size={260} />
        </div>
        <p className="font-semibold">{current.tierName}</p>
        <p className="text-sm text-muted-foreground">
          Show this to the buyer or let them photograph it
        </p>
        {lastSale.confirmationToken && (
          <p className="text-xs text-muted-foreground">
            Link:{' '}
            <span className="font-mono">
              /tickets/{lastSale.confirmationToken.slice(0, 8)}…
            </span>
          </p>
        )}
        <div className="mt-2 flex gap-2">
          {activeQrIndex > 0 && (
            <Button variant="outline" onClick={() => setActiveQrIndex((i) => i - 1)}>
              ← Previous
            </Button>
          )}
          {activeQrIndex < lastSale.tickets.length - 1 ? (
            <Button onClick={() => setActiveQrIndex((i) => i + 1)}>Next →</Button>
          ) : (
            <Button onClick={() => setLastSale(null)}>
              <Check className="mr-2 h-4 w-4" /> Done
            </Button>
          )}
        </div>
      </main>
    );
  }

  // ---- Not authorized to sell -----------------------------------------------
  if (info && !info.canSellAtDoor) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="font-medium">You can scan, but you can&apos;t sell at the door for this event.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask the organizer to grant door-sale permission on your invite.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/scanner/app/${eventId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scanner
          </Link>
        </Button>
      </main>
    );
  }

  // ---- Main UI --------------------------------------------------------------
  return (
    <main className="mx-auto max-w-lg px-4 pb-40 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/scanner/app/${eventId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Scanner
          </Link>
        </Button>
      </div>

      <h1 className="text-xl font-bold">{info?.eventName ?? 'Sell Tickets'}</h1>
      <p className="text-sm text-muted-foreground">
        {isComp ? 'Issuing comp tickets — no charge' : 'Take cash at the door'}
      </p>

      {loadError && (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          {loadError}
        </div>
      )}

      {/* Mode toggle */}
      <div className="mt-4 flex gap-2">
        <Button
          variant={isComp ? 'outline' : 'default'}
          className="flex-1"
          onClick={() => setIsComp(false)}
        >
          <Banknote className="mr-1.5 h-4 w-4" /> Cash sale
        </Button>
        <Button
          variant={isComp ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setIsComp(true)}
        >
          <Gift className="mr-1.5 h-4 w-4" /> Comp
        </Button>
      </div>

      {/* Tier picker */}
      <div className="mt-4 space-y-3">
        {info?.tiers.map((t) => {
          const qty = quantities[t.id] ?? 0;
          const soldOut = t.availableInventory <= 0;
          return (
            <Card key={t.id} className={soldOut ? 'opacity-50' : ''}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {isComp ? 'Free' : fmt(t.priceAmount, t.currency)}
                    {' · '}
                    {soldOut ? (
                      <span className="text-destructive">Sold out</span>
                    ) : (
                      `${t.availableInventory} left`
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setQty(t.id, qty - 1)}
                    disabled={qty === 0}
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-semibold tabular-nums">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setQty(t.id, qty + 1)}
                    disabled={soldOut || qty >= t.availableInventory}
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optional buyer info */}
      {totalQty > 0 && (
        <>
          <Separator className="my-5" />
          <p className="mb-2 text-sm font-medium">Buyer (optional)</p>
          <div className="grid gap-2">
            <Input
              placeholder="Name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="h-11"
            />
            <Input
              placeholder="Phone"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="h-11"
              inputMode="tel"
            />
          </div>

          <p className="mb-2 mt-4 text-sm font-medium">Send ticket to buyer</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Fill in one or both — buyer receives a link to their QR codes.
          </p>
          <div className="grid gap-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Email address"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="h-11 pl-9"
                inputMode="email"
              />
            </div>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="WhatsApp number (e.g. +18761234567)"
                value={buyerWhatsApp}
                onChange={(e) => setBuyerWhatsApp(e.target.value)}
                className="h-11 pl-9"
                inputMode="tel"
              />
            </div>
          </div>
        </>
      )}

      {submitError && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg space-y-2 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {totalQty} ticket{totalQty === 1 ? '' : 's'}
            </span>
            {info && (
              <span>
                Tonight: {info.mySalesToday} sold · {fmt(info.myRevenueToday, info.currency)}
              </span>
            )}
          </div>
          <Button
            size="lg"
            className="h-14 w-full text-base font-semibold"
            disabled={totalQty === 0 || submitting}
            onClick={submit}
          >
            {submitting
              ? 'Processing…'
              : totalQty === 0
                ? isComp ? 'Pick tier(s) to comp' : 'Pick tier(s) to sell'
                : isComp
                  ? `Issue ${totalQty} Comp Ticket${totalQty === 1 ? '' : 's'}`
                  : `Take ${fmt(subtotal, currency)} cash`}
          </Button>
        </div>
      </div>
    </main>
  );
}
