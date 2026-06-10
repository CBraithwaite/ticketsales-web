import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
        <Ticket className="h-8 w-8 text-primary" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">
        404 — Page not found
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        This ticket doesn&apos;t scan
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        The page you&apos;re looking for has moved, sold out, or never existed. Let&apos;s
        get you back to the action.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-sm font-semibold">
          <Link href="/">Browse Events</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-sm">
          <Link href="/help">Visit Help Centre</Link>
        </Button>
      </div>
    </div>
  );
}
