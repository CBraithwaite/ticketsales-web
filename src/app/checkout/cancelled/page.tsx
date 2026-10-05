'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

function CancelledContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get('order');

  if (searchParams.get('reason') === 'event_cancelled') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <XCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">This event was cancelled</h1>
        <p className="text-muted-foreground">
          The organizer cancelled the event while you were checking out, so no tickets were issued. Your payment
          {order && <> for order <span className="font-mono font-medium">{order}</span></>} will be refunded in
          full — we&apos;ll email you once it&apos;s on its way.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">Browse Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Checkout cancelled</h1>
      <p className="text-muted-foreground">
        Your payment was not completed and no charge has been made.
        {order && (
          <> Your reservation for order <span className="font-mono font-medium">{order}</span> has been released.</>
        )}
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <Button asChild>
          <Link href="/">Browse Events</Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <Suspense>
      <CancelledContent />
    </Suspense>
  );
}
