import Link from 'next/link';
import type { EventListItem } from '@/types/api';
import { CATEGORY_LABELS, COUNTRY_LABELS } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';
import { fmtTime, dayParts, DEFAULT_LOCALE } from '@/lib/datetime';

const fmtMoney = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function EventCard({ event }: { event: EventListItem }) {
  const soldOut = event.remainingInventory === 0;
  const limited = !soldOut && event.remainingInventory > 0 &&
    event.remainingInventory <= Math.max(10, event.totalInventory * 0.1);
  const cat = (CATEGORY_LABELS as Record<string, string>)[event.category] ?? event.category;
  const country = (COUNTRY_LABELS as Record<string, string>)[event.country] ?? event.country;
  const date = dayParts(event.startsAt, event.timeZone);
  const isSeries = event.type === 'Series';

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-border"
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gradient-hero">
            <span className="font-display text-5xl font-black text-white/20 select-none">
              {event.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Scrim at the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

        {/* Date chip */}
        <div className="absolute right-3 top-3 flex flex-col items-center rounded-lg bg-white/95 px-2.5 py-1.5 text-center shadow-md">
          <span className="text-[9px] font-bold leading-none tracking-widest text-primary">{date.month}</span>
          <span className="text-lg font-display font-bold leading-tight text-foreground">{date.day}</span>
        </div>

        {/* Category + status badges bottom-left */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-xs text-[11px] font-medium">
            {cat}
          </Badge>
          {soldOut && (
            <Badge className="bg-red-600/90 text-white border-0 text-[11px] font-medium">
              Sold out
            </Badge>
          )}
          {limited && (
            <Badge className="bg-amber-500/90 text-white border-0 text-[11px] font-medium">
              Few left
            </Badge>
          )}
          {isSeries && (
            <Badge className="bg-primary/90 text-white border-0 text-[11px] font-medium">
              {event.occurrenceCount > 0 ? `${event.occurrenceCount} dates` : 'Multiple dates'}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display font-bold text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        <div className="mt-2 flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            {date.weekday}, {date.month} {date.day} · {fmtTime(event.startsAt, event.timeZone)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.venueName}, {country}</span>
          </span>
        </div>

        {/* Price row */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">From</p>
            <p className="font-display font-bold text-base leading-none text-foreground">
              {fmtMoney(event.lowestPriceAmount, event.lowestPriceCurrency)}
            </p>
          </div>
          <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-2">
            Get tickets →
          </span>
        </div>
      </div>
    </Link>
  );
}
