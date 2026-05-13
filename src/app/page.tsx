import Link from 'next/link';
import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api';
import type { EventListItem } from '@/types/api';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, MapPin, Music, Sparkles, ArrowRight } from 'lucide-react';

async function fetchPublicEvents(): Promise<{ events: EventListItem[]; error: string | null }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events`, { cache: 'no-store' });
    if (!res.ok) return { events: [], error: `API responded with ${res.status}` };
    return { events: (await res.json()) as EventListItem[], error: null };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export default async function Home() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const { events, error: eventsError } = await fetchPublicEvents();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 opacity-5" />
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Jamaica&apos;s #1 Event Platform</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Discover Amazing Events{' '}
              <span className="text-accent">Across Jamaica</span>
            </h1>
            <p className="mt-4 text-lg text-white/80 sm:text-xl">
              From Kingston dancehall parties to Montego Bay beach festivals — find, book, and experience the best events on the island.
            </p>
          </div>

          {/* Stats pills */}
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in-up-delay">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
              <Music className="h-4 w-4 text-accent" />
              <span className="font-semibold">{events.length}</span> Events
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-accent" />
              <span>14 Parishes</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
              <CalendarDays className="h-4 w-4 text-accent" />
              <span>Every weekend</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Upcoming Events</h2>
            <p className="mt-1 text-muted-foreground">Don&apos;t miss out on what&apos;s happening</p>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <div key={e.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <EventCard event={e} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="mt-8 border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">No upcoming events yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {eventsError
                    ? `Could not load events: ${eventsError}`
                    : 'Check back soon for exciting events across Jamaica!'
                  }
                </p>
              </div>
              {isAuthed && (
                <Button asChild>
                  <Link href="/organizer">
                    Create an event <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* CTA Section */}
      {!isAuthed && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to host your own event?
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Join TicketSales as an organizer and reach thousands of event-goers across Jamaica.
              </p>
              <div className="flex gap-3">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started Free <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
