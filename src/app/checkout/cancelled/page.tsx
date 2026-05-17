'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutCancelledPage() {
  const searchParams = useSearchParams();
  const order = searchParams.get('order');

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
