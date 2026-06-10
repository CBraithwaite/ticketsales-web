'use client';

import { useState } from 'react';
import type { EventListItem } from '@/types/api';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 12;

/** Renders events in pages of 12 with a "Show more" button instead of one endless wall. */
export default function EventGrid({ events }: { events: EventListItem[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = events.slice(0, visible);
  const remaining = events.length - shown.length;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((e, i) => (
          <div
            key={e.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(i % PAGE_SIZE) * 0.06}s` }}
          >
            <EventCard event={e} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-sm font-semibold"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more events ({remaining} more)
          </Button>
        </div>
      )}
    </>
  );
}
