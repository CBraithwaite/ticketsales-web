import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { authedFetch } from '@/lib/server-fetch';
import type { EventDetail } from '@/types/api';
import { CATEGORY_LABELS, PARISH_LABELS } from '@/types/api';
import TierManager from '@/components/events/TierManager';
import PromoCodeManager from '@/components/events/PromoCodeManager';
import ScannerManager from '@/components/events/ScannerManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Eye, Users, BarChart3, Package } from 'lucide-react';

interface Props {
  params: { id: string };
}

export const metadata = { title: 'Manage event · TicketSales' };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-JM', {
    timeZone: 'America/Jamaica',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const STATUS_VARIANT: Record<string, string> = {
  Draft: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-100',
  Published: 'bg-green-100 text-green-800 hover:bg-green-100',
  Unlisted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  Cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
  Completed: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
};

export default async function ManageEventPage({ params }: Props) {
  const res = await authedFetch(`/api/v1/organizers/me/events`);
  if (res.status === 401) redirect('/login?next=/organizer');
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">Failed to load events.</CardContent>
        </Card>
      </div>
    );
  }

  // Find this event among organizer's events, then fetch full detail
  const events = (await res.json()) as Array<{ id: string; slug: string }>;
  const match = events.find((e) => e.id === params.id);
  if (!match) notFound();

  const detailRes = await authedFetch(`/api/v1/events/${match.slug}`);
  if (!detailRes.ok) notFound();
  const ev = (await detailRes.json()) as EventDetail;

  // Fetch promo codes for this event
  const promosRes = await authedFetch(`/api/v1/events/${params.id}/promos`);
  const promoCodes = promosRes.ok ? await promosRes.json() : [];

  // Fetch scanners for this event
  const scannersRes = await authedFetch(`/api/v1/events/${params.id}/scanners`);
  const scanners = scannersRes.ok ? await scannersRes.json() : [];

  const cat = (CATEGORY_LABELS as Record<string, string>)[ev.category] ?? ev.category;
  const parish = (PARISH_LABELS as Record<string, string>)[ev.parish] ?? ev.parish;

  const totalInventory = ev.tiers.reduce((s, t) => s + t.inventoryTotal, 0);
  const totalSold = ev.tiers.reduce((s, t) => s + t.inventorySold, 0);
  const totalAvailable = ev.tiers.reduce((s, t) => s + t.inventoryAvailable, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
        <Link href="/organizer"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
      </Button>

      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{ev.name}</h1>
                <Badge className={STATUS_VARIANT[ev.status] ?? ''}>
                  {ev.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {cat} · {parish} · {ev.venueName}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fmtDate(ev.startsAt)} — {fmtDate(ev.endsAt)}
              </p>
            </div>
            {ev.status === 'Published' && (
              <Button variant="outline" asChild size="sm">
                <Link href={`/events/${ev.slug}`}>
                  <Eye className="h-4 w-4 mr-1" /> View Public
                </Link>
              </Button>
            )}
          </div>

          <Separator className="my-6" />

          {/* Inventory summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalInventory}</p>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <BarChart3 className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{totalSold}</p>
                  <p className="text-xs text-muted-foreground">Sold</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{totalAvailable}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <TierManager eventId={ev.id} tiers={ev.tiers} />
          <PromoCodeManager eventId={ev.id} promoCodes={promoCodes} tiers={ev.tiers} />
          <ScannerManager eventId={ev.id} scanners={scanners} />
        </CardContent>
      </Card>
    </div>
  );
}
