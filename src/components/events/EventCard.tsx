import Link from 'next/link';
import type { EventListItem } from '@/types/api';
import { CATEGORY_LABELS, PARISH_LABELS } from '@/types/api';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-JM', {
    timeZone: 'America/Jamaica',
    hour: 'numeric',
    minute: '2-digit',
  });

const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return {
    day: d.toLocaleString('en-JM', { timeZone: 'America/Jamaica', day: 'numeric' }),
    month: d.toLocaleString('en-JM', { timeZone: 'America/Jamaica', month: 'short' }).toUpperCase(),
    weekday: d.toLocaleString('en-JM', { timeZone: 'America/Jamaica', weekday: 'short' }),
  };
};

const fmtMoney = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;

export default function EventCard({ event }: { event: EventListItem }) {
  const soldOut = event.remainingInventory === 0;
  const limited = !soldOut && event.remainingInventory <= Math.max(10, event.totalInventory * 0.1);
  const cat = (CATEGORY_LABELS as Record<string, string>)[event.category] ?? event.category;
  const parish = (PARISH_LABELS as Record<string, string>)[event.parish] ?? event.parish;
  const date = fmtDay(event.startsAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-200">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/60 via-primary/40 to-accent/40">
            <span className="text-5xl font-bold text-white/90 drop-shadow-md">
              {event.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Date chip top-right */}
        <div className="absolute right-3 top-3 flex flex-col items-center rounded-lg bg-white/95 px-2.5 py-1.5 text-center shadow-md backdrop-blur-sm">
          <span className="text-[10px] font-semibold leading-none text-primary">{date.month}</span>
          <span className="text-lg font-bold leading-tight text-foreground">{date.day}</span>
        </div>

        {/* Status badges bottom-left */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm text-xs shadow-sm">
            {cat}
          </Badge>
          {soldOut && (
            <Badge className="bg-red-600 text-white text-xs shadow-sm">Sold out</Badge>
          )}
          {limited && !soldOut && (
            <Badge className="bg-amber-500 text-white text-xs shadow-sm">Few left</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {event.name}
        </h3>
        <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {date.weekday}, {date.month} {date.day} · {fmtTime(event.startsAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {event.venueName}, {parish}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">
            From {fmtMoney(event.lowestPriceAmount, event.lowestPriceCurrency)}
          </p>
        </div>
      </CardContent>
    </Link>
  );
}
