'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AdminEventItem } from '@/types/api';
import { DEFAULT_LOCALE } from '@/lib/datetime';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CancelEventButton from '@/components/events/CancelEventButton';

const STATUS_BADGE: Record<string, string> = {
  Draft: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-100',
  Published: 'bg-green-100 text-green-800 hover:bg-green-100',
  Unlisted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  Cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
  Completed: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminEventList({ events }: { events: AdminEventItem[] }) {
  const [query, setQuery] = useState('');
  const now = new Date();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.name.toLowerCase().includes(q) || e.organizerName.toLowerCase().includes(q));
  }, [events, query]);

  return (
    <div className="mt-4 space-y-3">
      <Input
        placeholder="Search by event or organizer"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {shown.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No events match.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {shown.map((e) => {
            const cancellable = e.status !== 'Cancelled' && e.status !== 'Completed' && new Date(e.endsAt) > now;
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/events/${e.slug}`} className="truncate font-medium hover:underline">
                      {e.name}
                    </Link>
                    <Badge className={STATUS_BADGE[e.status] ?? ''}>{e.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {e.organizerName} · {fmtDate(e.startsAt)} · {e.ticketsSold} sold
                  </p>
                </div>
                {cancellable && <CancelEventButton eventId={e.id} eventName={e.name} compact />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
