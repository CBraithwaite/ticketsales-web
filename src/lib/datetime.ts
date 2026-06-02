/**
 * Centralized date/time formatting. Event-scoped times should pass the event's own IANA
 * `timeZone`; generic spots fall back to the launch defaults below. This module is the ONLY
 * place the launch locale/zone live — don't scatter 'America/Jamaica' / 'en-JM' literals again.
 */
export const DEFAULT_LOCALE = 'en-JM';
export const DEFAULT_TIMEZONE = 'America/Jamaica';

type Opts = Intl.DateTimeFormatOptions;

/** Format an ISO timestamp in the given (or default) time zone. */
export function fmtDateTime(iso: string, timeZone?: string | null, opts: Opts = {}): string {
  return new Date(iso).toLocaleString(DEFAULT_LOCALE, {
    timeZone: timeZone || DEFAULT_TIMEZONE,
    ...opts,
  });
}

/** Long "When" line, e.g. "Monday, June 1, 2026, 8:00 PM". */
export function fmtLong(iso: string, timeZone?: string | null): string {
  return fmtDateTime(iso, timeZone, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/** Compact line, e.g. "Mon, Jun 1, 8:00 PM". */
export function fmtShort(iso: string, timeZone?: string | null): string {
  return fmtDateTime(iso, timeZone, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** Time only, e.g. "8:00 PM". */
export function fmtTime(iso: string, timeZone?: string | null): string {
  return fmtDateTime(iso, timeZone, { hour: 'numeric', minute: '2-digit' });
}

/** A start–end range rendered in one time zone. */
export function fmtRange(startIso: string, endIso: string, timeZone?: string | null): string {
  return `${fmtLong(startIso, timeZone)} — ${fmtTime(endIso, timeZone)}`;
}

/** Day chip parts (numeric day / short month / short weekday) for cards. */
export function dayParts(iso: string, timeZone?: string | null) {
  return {
    day: fmtDateTime(iso, timeZone, { day: 'numeric' }),
    month: fmtDateTime(iso, timeZone, { month: 'short' }).toUpperCase(),
    weekday: fmtDateTime(iso, timeZone, { weekday: 'short' }),
  };
}
