import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authedFetch } from '@/lib/server-fetch';
import type { OrganizerResponse, EventListItem } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, ExternalLink, Settings, CalendarDays, Ticket, TrendingUp, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Organizer dashboard · TicketSales' };

const STATUS_BADGE: Record<EventListItem['status'], string> = {
  Draft: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  Published: 'bg-green-100 text-green-800 border-green-200',
  Unlisted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default async function OrganizerDashboard() {
  const orgRes = await authedFetch('/api/v1/organizers/me');
  if (orgRes.status === 404) redirect('/organizer/apply');
  if (orgRes.status === 401) redirect('/login?next=/organizer');
  if (!orgRes.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">Could not load your organizer profile (status {orgRes.status}).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const organizer = (await orgRes.json()) as OrganizerResponse;
  const eventsRes = await authedFetch('/api/v1/organizers/me/events');
  const events = eventsRes.ok ? ((await eventsRes.json()) as EventListItem[]) : [];

  const totalTickets = events.reduce((s, e) => s + e.totalInventory, 0);
  const totalSold = events.reduce((s, e) => s + (e.totalInventory - e.remainingInventory), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organizer.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{organizer.contactEmail} · {organizer.contactPhone}</p>
          {organizer.verificationStatus !== 'Approved' && (
            <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {organizer.verificationStatus}
            </Badge>
          )}
        </div>
        {organizer.verificationStatus === 'Approved' && (
          <Button asChild>
            <Link href="/organizer/events/new">
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Link>
          </Button>
        )}
      </header>

      {/* Quick stats */}
      {events.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <Ticket className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSold}</p>
                <p className="text-xs text-muted-foreground">Tickets Sold</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">Sell-through</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your Events</h2>

        {events.length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">No events yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first event to get started selling tickets.
                </p>
              </div>
              <Button asChild>
                <Link href="/organizer/events/new">
                  <Plus className="h-4 w-4 mr-1" /> Create Event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {events.map((e) => (
              <Card key={e.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold truncate">{e.name}</h3>
                      <Badge className={STATUS_BADGE[e.status] + ' text-xs shrink-0'}>{e.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(e.startsAt).toLocaleString('en-JM', { timeZone: 'America/Jamaica', dateStyle: 'medium', timeStyle: 'short' })}
                      {' · '}{e.venueName}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {e.totalInventory - e.remainingInventory}/{e.totalInventory} sold
                      </span>
                      <span>
                        From {e.lowestPriceCurrency} {e.lowestPriceAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild size="sm">
                      <Link href={`/organizer/events/${e.id}`}>
                        <Settings className="h-3.5 w-3.5 mr-1" /> Manage
                      </Link>
                    </Button>
                    {e.status === 'Published' && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/events/${e.slug}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
