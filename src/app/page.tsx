import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { getApiBaseUrl } from '@/lib/api';
import type { EventListItem } from '@/types/api';
import { CATEGORY_LABELS, COUNTRY_LABELS } from '@/types/api';
import {
  DATE_FILTERS,
  DATE_FILTER_LABELS,
  matchesDateFilter,
  parseDateFilter,
} from '@/lib/event-filters';
import EventGrid from '@/components/events/EventGrid';
import SearchBar from '@/components/events/SearchBar';
import HeroTicket from '@/components/layout/HeroTicket';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  ArrowRight,
  Music2,
  Mic2,
  PartyPopper,
  Presentation,
  QrCode,
  ScanLine,
  ShieldCheck,
  Star,
  Users2,
  Zap,
  SearchX,
  X,
} from 'lucide-react';

interface HomeSearchParams {
  q?: string;
  category?: string;
  country?: string;
  date?: string;
}

/**
 * Fetch with search + country only. Category and date narrowing happen here in
 * the page so we can tell which filter chips actually have matches to offer.
 */
async function fetchPublicEvents(
  sp: HomeSearchParams,
): Promise<{ events: EventListItem[]; error: string | null }> {
  try {
    const params = new URLSearchParams({ limit: '100' });
    if (sp.q) params.set('q', sp.q);
    if (sp.country) params.set('country', sp.country);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events?${params}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { events: [], error: `API responded with ${res.status}` };
    return { events: (await res.json()) as EventListItem[], error: null };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

const CATEGORIES = [
  { key: 'Dancehall', label: 'Dancehall', icon: Music2 },
  { key: 'Reggae', label: 'Reggae', icon: Music2 },
  { key: 'StageShow', label: 'Stage Show', icon: Mic2 },
  { key: 'Festival', label: 'Festival', icon: Star },
  { key: 'Party', label: 'Party', icon: PartyPopper },
  { key: 'Comedy', label: 'Comedy', icon: Users2 },
  { key: 'Concert', label: 'Concert', icon: Zap },
  { key: 'Conference', label: 'Conference', icon: Presentation },
];

/** Build a homepage href that merges the current filters with a patch. */
function buildHref(sp: HomeSearchParams, patch: Partial<HomeSearchParams>): string {
  const merged: HomeSearchParams = { ...sp, ...patch };
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'country', 'date'] as const) {
    if (merged[key]) params.set(key, merged[key]!);
  }
  const qs = params.toString();
  return qs ? `/?${qs}#events` : '/#events';
}

export default async function Home(
  props: {
    searchParams: Promise<HomeSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isAuthed = !!session?.user;

  const sp: HomeSearchParams = {
    q: searchParams.q?.trim() || undefined,
    category: searchParams.category || undefined,
    country: searchParams.country || undefined,
    date: searchParams.date || undefined,
  };
  const dateFilter = parseDateFilter(sp.date);
  const hasFilters = !!(sp.q || sp.category || sp.country || dateFilter);

  const { events: fetched, error: eventsError } = await fetchPublicEvents(sp);

  // Narrowed by everything except the chip's own dimension — a chip is only
  // offered when picking it would yield results (or it's active, so it can be cleared).
  const byDate = dateFilter ? fetched.filter((e) => matchesDateFilter(e, dateFilter)) : fetched;
  const byCategory = sp.category ? fetched.filter((e) => e.category === sp.category) : fetched;

  const visibleCategories = CATEGORIES.filter(
    (c) => sp.category === c.key || byDate.some((e) => e.category === c.key),
  );
  const visibleDateFilters = DATE_FILTERS.filter(
    (d) => dateFilter === d || byCategory.some((e) => matchesDateFilter(e, d)),
  );

  let events = sp.category ? byDate.filter((e) => e.category === sp.category) : byDate;
  // Available events first, sold-out ones at the end (stable within each group).
  events = [...events].sort(
    (a, b) => Number(a.remainingInventory === 0) - Number(b.remainingInventory === 0),
  );

  const countryLabel = sp.country
    ? ((COUNTRY_LABELS as Record<string, string>)[sp.country] ?? sp.country)
    : undefined;
  const categoryLabel = sp.category
    ? ((CATEGORY_LABELS as Record<string, string>)[sp.category] ?? sp.category)
    : undefined;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 bg-dot-grid" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-primary/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-10 px-4 py-7 sm:px-6 sm:py-9 lg:py-8">
          <div className="min-w-0 animate-fade-in-up">
            {/* Headline */}
            <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
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

            {/* One line at every width: a shorter version on phones. */}
            <p className="mt-3 whitespace-nowrap text-[15px] text-white/80 sm:text-lg">
              <span className="sm:hidden">Concerts, parties, conferences &amp; more.</span>
              <span className="hidden sm:inline">
                Concerts, parties, conferences &amp; more — QR tickets in seconds.
              </span>
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-white/90 animate-fade-in-up-delay">
              {[
                { icon: QrCode, label: 'QR tickets by email' },
                { icon: ShieldCheck, label: 'Card & cash payments' },
                { icon: ScanLine, label: '2-second gate scans' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-3.5 w-3.5 text-[hsl(44_96%_62%)]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <HeroTicket />
        </div>
      </section>

      {/* ── Search + category strip ── */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className={
              visibleCategories.length > 0
                ? 'flex gap-2 overflow-x-auto py-3 scrollbar-none'
                : 'py-2'
            }
          >
            {visibleCategories.map((cat) => {
              const active = sp.category === cat.key;
              return (
                <Link
                  key={cat.key}
                  href={buildHref(sp, { category: active ? undefined : cat.key })}
                  aria-pressed={active}
                  className={
                    active
                      ? 'inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground'
                      : 'inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10'
                  }
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                  {active && <X className="h-3 w-3" />}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Events grid ── */}
      <section id="events" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              What&apos;s On
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {sp.q ? `Results for “${sp.q}”` : 'Upcoming Events'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} event{events.length !== 1 ? 's' : ''}
              {categoryLabel ? ` · ${categoryLabel}` : ''}
              {countryLabel ? ` · ${countryLabel}` : ''}
              {dateFilter ? ` · ${DATE_FILTER_LABELS[dateFilter]}` : ''}
            </p>
          </div>

          {hasFilters && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href="/#events">
                <X className="h-3.5 w-3.5" /> Clear all filters
              </Link>
            </Button>
          )}
        </div>

        {/* Date chips */}
        <div
          className={
            visibleDateFilters.length > 0 ? 'mb-8 flex flex-wrap gap-2' : 'mb-2'
          }
        >
          {visibleDateFilters.map((d) => {
            const active = dateFilter === d;
            return (
              <Link
                key={d}
                href={buildHref(sp, { date: active ? undefined : d })}
                aria-pressed={active}
                className={
                  active
                    ? 'inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground'
                    : 'inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10'
                }
              >
                <CalendarDays className="h-3 w-3" />
                {DATE_FILTER_LABELS[d]}
                {active && <X className="h-3 w-3" />}
              </Link>
            );
          })}
        </div>

        {events.length > 0 ? (
          <EventGrid key={JSON.stringify(sp)} events={events} />
        ) : hasFilters && !eventsError ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
              <SearchX className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">No events match</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                {sp.q
                  ? `Nothing found for “${sp.q}”. Try a different name, artist, or venue.`
                  : 'Try widening your filters to see more events.'}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-sm mt-1">
              <Link href="/#events">Clear all filters</Link>
            </Button>
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
