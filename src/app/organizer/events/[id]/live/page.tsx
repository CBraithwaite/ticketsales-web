'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/datetime';
import {
  ArrowLeft,
  TicketCheck,
  Banknote,
  PercentCircle,
  Activity,
  RefreshCw,
  CircleDot,
  ScanLine,
  Gift,
} from 'lucide-react';

interface LiveStatsResponse {
  event: {
    id: string;
    name: string;
    startsAt: string;
    venueName: string;
    capacity: number;
  };
  totals: {
    soldCount: number;
    compCount: number;
    scannedCount: number;
    revenueOnline: { amount: number; currency: string };
    revenueDoor: { amount: number; currency: string };
    revenueTotal: { amount: number; currency: string };
    capacityUtilization: number;
  };
  byTier: Array<{
    tierId: string;
    tierName: string;
    capacity: number;
    soldOnline: number;
    soldDoor: number;
    compIssued: number;
    scanned: number;
    revenue: { amount: number; currency: string };
  }>;
  byGate: Array<{ gate: string; scanned: number }>;
  scanRateLast15Min: number;
  recentActivity: Array<{ at: string; kind: string; label: string }>;
}

const POLL_INTERVAL_MS = 4000;

const fmtMoney = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });

function ActivityIcon({ kind }: { kind: string }) {
  if (kind === 'scan') return <ScanLine className="h-3.5 w-3.5 text-blue-600" />;
  if (kind === 'doorSale') return <Banknote className="h-3.5 w-3.5 text-green-600" />;
  if (kind === 'comp') return <Gift className="h-3.5 w-3.5 text-purple-600" />;
  return <TicketCheck className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function LiveConsolePage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [stats, setStats] = useState<LiveStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/events/${eventId}/live-stats`,
        { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' },
      );
      if (!res.ok) {
        setError(res.status === 403 ? 'Not authorized for this event.' : `Failed (${res.status}).`);
        return;
      }
      const data: LiveStatsResponse = await res.json();
      setStats(data);
      setError(null);
      setLastFetch(new Date());
    } catch {
      setError('Network error.');
    }
  }, [eventId, session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetchStats();
    const t = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [session?.accessToken, fetchStats]);

  if (status === 'loading' || (!stats && !error)) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading live console…</p>
      </main>
    );
  }

  if (error && !stats) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="font-medium text-destructive">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/organizer/events/${eventId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to event
          </Link>
        </Button>
      </main>
    );
  }

  if (!stats) return null;

  const { event: ev, totals, byTier, byGate, scanRateLast15Min, recentActivity } = stats;
  const scanPct = totals.soldCount + totals.compCount > 0
    ? totals.scannedCount / (totals.soldCount + totals.compCount)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link href={`/organizer/events/${eventId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Event
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{ev.name}</h1>
          <p className="text-sm text-muted-foreground">
            {ev.venueName} · Capacity {ev.capacity.toLocaleString(DEFAULT_LOCALE)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CircleDot className="h-3 w-3 animate-pulse text-red-500" />
          <span>LIVE</span>
          <span>·</span>
          <span>Refresh every {POLL_INTERVAL_MS / 1000}s</span>
          {lastFetch && (
            <>
              <span>·</span>
              <span>Last {lastFetch.toLocaleTimeString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE })}</span>
            </>
          )}
          <Button variant="ghost" size="icon-sm" onClick={fetchStats} aria-label="Refresh now">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          {error} — using last successful data.
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TicketCheck className="h-3.5 w-3.5" /> Tickets out
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {(totals.soldCount + totals.compCount).toLocaleString(DEFAULT_LOCALE)}
              <span className="text-base font-normal text-muted-foreground">
                {' / '}{ev.capacity.toLocaleString(DEFAULT_LOCALE)}
              </span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, totals.capacityUtilization * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totals.soldCount.toLocaleString(DEFAULT_LOCALE)} sold + {totals.compCount.toLocaleString(DEFAULT_LOCALE)} comp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <ScanLine className="h-3.5 w-3.5" /> Scanned
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {totals.scannedCount.toLocaleString(DEFAULT_LOCALE)}
              <span className="text-base font-normal text-muted-foreground"> · {fmtPct(scanPct)}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              ↑ {scanRateLast15Min}/15min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" /> Revenue
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {fmtMoney(totals.revenueTotal.amount, totals.revenueTotal.currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Online {fmtMoney(totals.revenueOnline.amount, totals.revenueOnline.currency)}
              {' + '}
              Door {fmtMoney(totals.revenueDoor.amount, totals.revenueDoor.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <PercentCircle className="h-3.5 w-3.5" /> Capacity
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {fmtPct(totals.capacityUtilization)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {Math.max(0, ev.capacity - totals.soldCount - totals.compCount).toLocaleString(DEFAULT_LOCALE)} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By tier */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="border-b px-4 py-3 text-sm font-semibold">By Tier</div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tier</th>
                <th className="px-4 py-2 text-right font-medium">Capacity</th>
                <th className="px-4 py-2 text-right font-medium">Online</th>
                <th className="px-4 py-2 text-right font-medium">Door</th>
                <th className="px-4 py-2 text-right font-medium">Comp</th>
                <th className="px-4 py-2 text-right font-medium">Scanned</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byTier.map((t) => (
                <tr key={t.tierId} className="border-t">
                  <td className="px-4 py-2 font-medium">{t.tierName}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{t.capacity}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{t.soldOnline}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{t.soldDoor}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{t.compIssued}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {t.scanned}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t.soldOnline + t.soldDoor + t.compIssued > 0
                        ? fmtPct(t.scanned / (t.soldOnline + t.soldDoor + t.compIssued))
                        : '—'})
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtMoney(t.revenue.amount, t.revenue.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By gate */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 text-sm font-semibold">By Gate</div>
            {byGate.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No scans yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {byGate.map((g) => (
                    <tr key={g.gate} className="border-t">
                      <td className="px-4 py-2">{g.gate}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{g.scanned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
              <Activity className="h-4 w-4" /> Activity
            </div>
            {recentActivity.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nothing yet — go sell something.</p>
            ) : (
              <ul className="divide-y">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 px-4 py-2 text-sm">
                    <ActivityIcon kind={a.kind} />
                    <span className="flex-1">{a.label}</span>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {fmtTime(a.at)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
