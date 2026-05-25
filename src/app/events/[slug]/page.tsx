import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import type { EventDetail } from '@/types/api';
import { CATEGORY_LABELS, PARISH_LABELS } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Shirt, ArrowLeft } from 'lucide-react';
import CheckoutPanel from '@/components/checkout/CheckoutPanel';

interface Props {
  params: { slug: string };
}

const fmtDateRange = (startIso: string, endIso: string) => {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Jamaica',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  return `${new Date(startIso).toLocaleString('en-JM', opts)} — ${new Date(endIso).toLocaleString('en-JM', opts)}`;
};

const fmtMoney = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API responded with ${res.status}`);
  return (await res.json()) as EventDetail;
}

export async function generateMetadata({ params }: Props) {
  const ev = await fetchEvent(params.slug).catch(() => null);
  if (!ev) return { title: 'Event not found · TicketSales' };
  return {
    title: `${ev.name} · TicketSales`,
    description: ev.description.slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: Props) {
  const ev = await fetchEvent(params.slug);
  if (!ev) notFound();

  const cat = (CATEGORY_LABELS as Record<string, string>)[ev.category] ?? ev.category;
  const parish = (PARISH_LABELS as Record<string, string>)[ev.parish] ?? ev.parish;

  return (
    <div className="pb-16">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to events</Link>
        </Button>
      </div>

      {/* Hero image */}
      <div className="mx-auto mt-4 max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-neutral-200">
          {ev.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ev.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center gradient-hero">
              <span className="text-7xl font-bold text-white/30">{ev.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/10">{cat}</Badge>
              {ev.ageRestriction && (
                <Badge variant="destructive" className="backdrop-blur-sm">{ev.ageRestriction}</Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl drop-shadow-md">{ev.name}</h1>
            <p className="mt-1 text-sm text-white/80">by {ev.organizer.businessName}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-8 max-w-4xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: details */}
          <div className="space-y-8">
            {/* Quick info cards */}
            <div className="grid gap-3">
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">When</p>
                    <p className="mt-0.5 text-sm font-medium">{fmtDateRange(ev.startsAt, ev.endsAt)}</p>
                    <p className="text-xs text-muted-foreground">{ev.timeZone}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Where</p>
                    <p className="mt-0.5 text-sm font-medium">{ev.venueName}</p>
                    <p className="text-xs text-muted-foreground">{ev.venueAddress}, {parish}</p>
                  </div>
                </CardContent>
              </Card>
              {ev.dressCode && (
                <Card>
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Shirt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dress Code</p>
                      <p className="mt-0.5 text-sm font-medium">{ev.dressCode}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* About */}
            <div>
              <h2 className="text-lg font-semibold">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{ev.description}</p>
            </div>
          </div>

          {/* Right: Checkout panel */}
          <div className="lg:col-span-2">
            <CheckoutPanel event={ev} />
          </div>
        </div>
      </div>
    </div>
  );
}
