'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-destructive">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Hit a snag backstage
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        An unexpected error occurred. It wasn&apos;t anything you did — try again, and if
        it keeps happening, let us know.
        {error.digest && (
          <span className="mt-2 block text-xs text-muted-foreground/70">
            Error reference: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="rounded-sm font-semibold">
          Try Again
        </Button>
        <Button asChild variant="outline" className="rounded-sm">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
