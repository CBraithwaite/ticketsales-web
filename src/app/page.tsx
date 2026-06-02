import Link from 'next/link';
import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api';
import type { EventListItem } from '@/types/api';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, Music2, Mic2, PartyPopper, Star, Users2, Zap } from 'lucide-react';

async function fetchPublicEvents(): Promise<{ events: EventListItem[]; error: string | null }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events`, { cache: 'no-store' });
    if (!res.ok) return { events: [], error: `API responded with ${res.status}` };
    return { events: (await res.json()) as EventListItem[], error: null };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

const CATEGORIES = [
  { label: 'Dancehall', icon: Music2, href: '/?category=Dancehall' },
  { label: 'Reggae', icon: Music2, href: '/?category=Reggae' },
  { label: 'Stage Show', icon: Mic2, href: '/?category=StageShow' },
  { label: 'Festival', icon: Star, href: '/?category=Festival' },
  { label: 'Party', icon: PartyPopper, href: '/?category=Party' },
  { label: 'Comedy', icon: Users2, href: '/?category=Comedy' },
  { label: 'Concert', icon: Zap, href: '/?category=Concert' },
];

export default async function Home() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const { events, error: eventsError } = await fetchPublicEvents();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 bg-dot-grid" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-primary/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12 flex items-center justify-between gap-8">
          <div className="max-w-2xl animate-fade-in-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-subtle" />
              Your #1 Event Platform
            </div>

            {/* Headline */}
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Discover{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, hsl(44 96% 60%) 0%, hsl(44 96% 80%) 100%)',
                }}
              >
                Amazing Events
              </span>
              {' '}Near You
            </h1>

            <p className="mt-2 text-sm text-white/70 sm:text-base max-w-xl leading-relaxed">
              From Kingston dancehall parties to Montego Bay beach festivals — find, book,
              and experience the best events on the island.
            </p>

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap gap-3 animate-fade-in-up-delay">
              <Button
                size="lg"
                className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg shadow-accent/20 border-0"
                asChild
              >
                <Link href="/#events">
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!isAuthed && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-sm border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold backdrop-blur-sm"
                  asChild
                >
                  <Link href="/signup">Sell Your Tickets</Link>
                </Button>
              )}
            </div>

            {/* Trust stats */}
            <div className="mt-4 flex flex-wrap gap-5 animate-fade-in-up-delay-2">
              {[
                { value: `${events.length}+`, label: 'Live Events' },
                { value: 'Secure', label: 'Card & cash payments' },
                { value: '2s', label: 'Gate scan time' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-display text-xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-white/50 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right-side Sell Tickets CTA */}
          <div className="hidden lg:flex shrink-0 flex-col items-center gap-3 animate-fade-in-up">
            <Button
              size="lg"
              className="rounded-s-sm bg-white text-primary hover:bg-white/90 font-semibold shadow-lg px-8"
              asChild
            >
              <Link href={isAuthed ? '/organizer' : '/signup'}>
                Sell Tickets
              </Link>
            </Button>
            <span className="text-xs text-white/50">For organizers &amp; promoters</span>
          </div>
        </div>
      </section>

      {/* ── Category strip ── */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Events grid ── */}
      <section id="events" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              What&apos;s On
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Upcoming Events
            </h2>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {events.length} event{events.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <div
                key={e.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <EventCard event={e} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">No upcoming events yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                {eventsError
                  ? `Could not load events: ${eventsError}`
                  : 'Check back soon for exciting events near you!'}
              </p>
            </div>
            {isAuthed && (
              <Button asChild className="rounded-sm mt-1">
                <Link href="/organizer">
                  Create an event <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ── Organizer CTA ── */}
      {!isAuthed && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl gradient-hero p-8 sm:p-12 text-white text-center">
              <div className="absolute inset-0 bg-dot-grid opacity-50" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                  For Organizers
                </p>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Ready to host your own event?
                </h2>
                <p className="mt-3 text-white/70 max-w-md mx-auto text-sm sm:text-base">
                  Join Choice Stubs and reach thousands of event-goers.
                  Set up, sell, and scan — all in one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Button
                    size="lg"
                    className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold border-0"
                    asChild
                  >
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-sm border-white/30 bg-white/10 text-white hover:bg-white/20"
                    asChild
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
