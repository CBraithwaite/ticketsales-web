import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authedFetch } from '@/lib/server-fetch';
import type { OrganizerResponse, EventListItem } from '@/types/api';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Plus, ExternalLink, Settings, CalendarDays, Ticket, TrendingUp, AlertCircle, Wallet,
  Banknote, ScanLine, Clock, Users, ReceiptText,
} from 'lucide-react';

export const metadata = { title: 'Organizer dashboard · Choice Stubs' };

type OrganizerStats = import('@/types/api').OrganizerStatsResponse;
type CurrencyAmount = import('@/types/api').CurrencyAmount;
type PayoutEventSummary = import('@/types/api').PayoutEventSummary;

const CURRENCY_PREFIX: Record<string, string> = {
  JMD: 'J$', USD: 'US$', CAD: 'CA$', TTD: 'TT$', BBD: 'Bds$', GBP: '£',
};

function fmtMoney({ currency, amount }: CurrencyAmount): string {
  const prefix = CURRENCY_PREFIX[currency] ?? `${currency} `;
  const compact = Math.abs(amount) >= 100_000;
  return `${prefix}${amount.toLocaleString(DEFAULT_LOCALE, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  })}`;
}

/** Largest currency shown as the headline; any others join the sub-line. */
function moneyParts(amounts: CurrencyAmount[]): { value: string; extra?: string } {
  if (amounts.length === 0) return { value: fmtMoney({ currency: 'JMD', amount: 0 }) };
  return {
    value: fmtMoney(amounts[0]),
    extra: amounts.length > 1 ? amounts.slice(1).map(fmtMoney).join(' · ') : undefined,
  };
}

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/80 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [eventsRes, statsRes, payoutRes] = await Promise.all([
    authedFetch('/api/v1/organizers/me/events'),
    authedFetch('/api/v1/organizers/me/stats'),
    authedFetch('/api/v1/organizers/me/payouts/summary'),
  ]);
  const events = eventsRes.ok ? ((await eventsRes.json()) as EventListItem[]) : [];
  const stats = statsRes.ok ? ((await statsRes.json()) as OrganizerStats) : null;
  const payoutSummaries = payoutRes.ok
    ? ((await payoutRes.json()) as PayoutEventSummary[])
    : [];

  const totalTickets = events.reduce((s, e) => s + e.totalInventory, 0);
  const totalSold = events.reduce((s, e) => s + (e.totalInventory - e.remainingInventory), 0);

  // Awaiting payout = settled-and-eligible plus already-requested amounts, per currency.
  const pendingPayout: CurrencyAmount[] = Object.entries(
    payoutSummaries.reduce<Record<string, number>>((acc, s) => {
      const amt = s.eligibleAmount + s.pendingPayoutAmount;
      if (amt > 0) acc[s.currency] = (acc[s.currency] ?? 0) + amt;
      return acc;
    }, {}),
  )
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);

  const gross = moneyParts(stats?.revenue.gross ?? []);
  const net = moneyParts(stats?.revenue.net ?? []);
  const last7 = moneyParts(stats?.revenue.grossLast7Days ?? []);
  const payout = moneyParts(pendingPayout);
  const needsAttention = (stats?.attention.pendingRefundRequests ?? 0) > 0;

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
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/organizer/payouts">
                <Wallet className="h-4 w-4 mr-1" /> Payouts
              </Link>
            </Button>
            <Button asChild>
              <Link href="/organizer/events/new">
                <Plus className="h-4 w-4 mr-1" /> Create Event
              </Link>
            </Button>
          </div>
        )}
      </header>

      {/* Needs attention */}
      {needsAttention && (
        <Card className="mt-8 border-amber-300 bg-amber-50">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-amber-700 shrink-0" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">
                  {stats!.attention.pendingRefundRequests} refund request
                  {stats!.attention.pendingRefundRequests !== 1 ? 's' : ''}
                </span>{' '}
                waiting for your decision — open the event to approve or decline.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue stats */}
      {stats && stats.revenue.gross.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Banknote}
            iconClass="bg-green-100 text-green-700"
            value={gross.value}
            label="Gross sales"
            sub={gross.extra}
          />
          <StatCard
            icon={Wallet}
            iconClass="bg-emerald-100 text-emerald-700"
            value={net.value}
            label="Net revenue"
            sub={net.extra ?? (stats.revenue.refunded.length > 0 ? 'after refunds' : undefined)}
          />
          <StatCard
            icon={TrendingUp}
            iconClass="bg-blue-100 text-blue-700"
            value={last7.value}
            label="Sales — last 7 days"
            sub={`${stats.tickets.soldLast7Days} ticket${stats.tickets.soldLast7Days !== 1 ? 's' : ''} this week`}
          />
          <StatCard
            icon={Clock}
            iconClass="bg-violet-100 text-violet-700"
            value={payout.value}
            label="Awaiting payout"
            sub={payout.extra}
          />
        </div>
      )}

      {/* Activity stats */}
      {events.length > 0 && (
        <div className={`${stats && stats.revenue.gross.length > 0 ? 'mt-4' : 'mt-8'} grid grid-cols-2 gap-4 lg:grid-cols-4`}>
          <StatCard
            icon={CalendarDays}
            iconClass="bg-primary/10 text-primary"
            value={String(stats?.events.total ?? events.length)}
            label="Events"
            sub={
              stats
                ? `${stats.events.published} published · ${stats.events.upcoming} upcoming`
                : undefined
            }
          />
          <StatCard
            icon={Ticket}
            iconClass="bg-green-100 text-green-700"
            value={String(stats?.tickets.sold ?? totalSold)}
            label="Tickets sold"
            sub={stats && stats.tickets.comps > 0 ? `incl. ${stats.tickets.comps} comps` : undefined}
          />
          <StatCard
            icon={ScanLine}
            iconClass="bg-sky-100 text-sky-700"
            value={String(stats?.tickets.scanned ?? 0)}
            label="Scanned at gate"
          />
          <StatCard
            icon={Users}
            iconClass="bg-amber-100 text-amber-700"
            value={
              stats && stats.attention.waitlistEntries > 0
                ? String(stats.attention.waitlistEntries)
                : `${totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0}%`
            }
            label={stats && stats.attention.waitlistEntries > 0 ? 'On waitlists' : 'Sell-through'}
            sub={
              stats && stats.attention.waitlistEntries > 0
                ? `${totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0}% sell-through`
                : undefined
            }
          />
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
                      {new Date(e.startsAt).toLocaleString(DEFAULT_LOCALE, { timeZone: e.timeZone || DEFAULT_TIMEZONE, dateStyle: 'medium', timeStyle: 'short' })}
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
