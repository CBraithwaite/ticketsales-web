import { DEFAULT_TIMEZONE } from './datetime';

/**
 * Date-window filtering for the homepage. Windows are evaluated against each
 * event's own calendar date in its own time zone, so "Today" means today where
 * the event happens.
 */

export const DATE_FILTERS = ['today', 'weekend', 'month'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: 'Today',
  weekend: 'This Weekend',
  month: 'This Month',
};

export function parseDateFilter(value: string | undefined): DateFilter | undefined {
  return DATE_FILTERS.includes(value as DateFilter) ? (value as DateFilter) : undefined;
}

/** 'YYYY-MM-DD' for an instant as seen in the given IANA zone. */
function localYmd(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function matchesDateFilter(
  event: { startsAt: string; timeZone: string },
  filter: DateFilter,
  now: Date = new Date(),
): boolean {
  const tz = event.timeZone || DEFAULT_TIMEZONE;
  const eventDay = localYmd(new Date(event.startsAt), tz);
  const today = localYmd(now, tz);

  switch (filter) {
    case 'today':
      return eventDay === today;
    case 'weekend': {
      // Friday–Sunday of the current week; if today is Sat/Sun this is the
      // ongoing weekend (the API already excludes past events).
      const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sun
      const daysUntilFriday = weekday === 0 ? -2 : 5 - weekday;
      const friday = addDays(today, daysUntilFriday);
      const sunday = addDays(friday, 2);
      return eventDay >= friday && eventDay <= sunday;
    }
    case 'month':
      return eventDay.slice(0, 7) === today.slice(0, 7);
  }
}
