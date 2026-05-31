'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dependency-free date + time picker. Renders a calendar grid and a time field in a
 * self-positioned popover (no Radix — avoids the popover positioning bugs this project's
 * Tailwind 3 / React 18 stack hits with the shadcn popover components).
 *
 * `value` / `onChange` use the same local "YYYY-MM-DDTHH:mm" string that <input
 * type="datetime-local"> produces, so it's a drop-in replacement.
 */
interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Days before this date are disabled (date-only comparison). */
  minDate?: Date;
  /** Show a × to unset the value — for optional fields where empty means "no limit". */
  clearable?: boolean;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function parse(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const fmtDisplay = (d: Date) =>
  d.toLocaleString('en-JM', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

export function DateTimePicker({ value, onChange, placeholder = 'Select date & time', minDate, clearable, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = parse(value);
  const [viewMonth, setViewMonth] = React.useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Jump the calendar to the selected month each time it opens.
  React.useEffect(() => {
    if (open && selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const timeStr = selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : '19:00';

  const pickDay = (day: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    onChange(toLocal(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day, h, m)));
  };

  const setTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const base = selected ?? new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    onChange(toLocal(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0)));
  };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDay = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-input bg-transparent py-1 pl-2.5 pr-2 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
          !selected && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{selected ? fmtDisplay(selected) : placeholder}</span>
        {!(clearable && selected) && <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {clearable && selected && (
        <button
          type="button"
          aria-label="Clear date"
          onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[17rem] rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="rounded-md p-1 hover:bg-muted"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{MONTHS[month]} {year}</span>
            <button type="button" className="rounded-md p-1 hover:bg-muted"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-[10px] font-medium text-muted-foreground">{w}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const cellDate = new Date(year, month, d);
              const isSel = !!selected && selected.getFullYear() === year
                && selected.getMonth() === month && selected.getDate() === d;
              const isToday = cellDate.getTime() === today.getTime();
              const disabled = minDay ? cellDate < minDay : false;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(d)}
                  className={cn(
                    'h-8 rounded-md text-sm transition-colors',
                    disabled && 'cursor-not-allowed text-muted-foreground/40',
                    !disabled && !isSel && 'hover:bg-muted',
                    isSel && 'bg-primary font-semibold text-primary-foreground',
                    !isSel && isToday && 'ring-1 ring-primary/40',
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground">Time</span>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
            />
            <button type="button" className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
              onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
