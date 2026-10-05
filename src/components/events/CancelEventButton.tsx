'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { DEFAULT_LOCALE } from '@/lib/datetime';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ban, Loader2 } from 'lucide-react';

interface Preview {
  paidOrders: number;
  cardRefunds: number;
  manualRefunds: number;
  compOrders: number;
  ticketsCancelled: number;
  unpaidCheckouts: number;
  refundTotals: { currency: string; amount: number }[];
}

interface Props {
  eventId: string;
  eventName: string;
  /** Smaller trigger for table rows. */
  compact?: boolean;
}

const MAX_REASON = 500;

const money = (t: { currency: string; amount: number }) =>
  `${t.currency} ${t.amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function CancelEventButton({ eventId, eventName, compact }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = (): Record<string, string> =>
    session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

  const openDialog = async () => {
    setOpen(true);
    setError(null);
    setPreview(null);
    setLoadingPreview(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/cancellation-preview`, {
        headers: authHeaders(),
      });
      if (res.ok) setPreview(await res.json());
      else setError(`Couldn't load the refund summary (${res.status}).`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const nameMatches = confirmName.trim().toLowerCase() === eventName.trim().toLowerCase();
  const canSubmit = nameMatches && reason.trim().length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ reason: reason.trim(), confirmName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const fieldError = body?.errors ? Object.values(body.errors as Record<string, string[]>)[0]?.[0] : null;
        setError(body?.error ?? fieldError ?? `Cancellation failed (${res.status}).`);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openDialog}
        className={`border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 ${compact ? 'h-7 px-2 text-xs' : ''}`}
      >
        <Ban className="mr-1 h-4 w-4" /> Cancel event
      </Button>

      <Dialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel {eventName}?</DialogTitle>
            <DialogDescription>
              Ticket sales stop and every ticket stops scanning right away. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            {loadingPreview && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working out refunds…
              </p>
            )}
            {preview && preview.paidOrders === 0 && preview.compOrders === 0 && (
              <p>No tickets have been sold, so nobody needs a refund.</p>
            )}
            {preview && (preview.paidOrders > 0 || preview.compOrders > 0) && (
              <ul className="space-y-1.5">
                {preview.paidOrders > 0 && (
                  <li>
                    <span className="font-semibold">{preview.refundTotals.map(money).join(' + ')}</span> refunded
                    in full, fees included, across {plural(preview.paidOrders, 'order')}.
                  </li>
                )}
                {preview.cardRefunds > 0 && (
                  <li>{plural(preview.cardRefunds, 'card payment')} go back to the buyer&apos;s card automatically.</li>
                )}
                {preview.manualRefunds > 0 && (
                  <li className="text-amber-800">
                    {plural(preview.manualRefunds, 'order')} paid by bank transfer, WiPay or cash — you&apos;ll need to
                    pay {preview.manualRefunds === 1 ? 'that buyer' : 'those buyers'} back yourself.
                  </li>
                )}
                {preview.compOrders > 0 && <li>{plural(preview.compOrders, 'complimentary order')} cancelled.</li>}
                <li>{plural(preview.ticketsCancelled, 'ticket')} invalidated. Every buyer gets an email.</li>
                {preview.unpaidCheckouts > 0 && (
                  <li className="text-muted-foreground">
                    {plural(preview.unpaidCheckouts, 'unfinished checkout')} closed.
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Message to ticket holders</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              maxLength={MAX_REASON}
              rows={3}
              placeholder="e.g. The headline act is ill. We're sorry — we hope to reschedule soon."
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the event page and in the cancellation email. {reason.length}/{MAX_REASON}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-confirm">
              Type <span className="font-semibold">{eventName}</span> to confirm
            </Label>
            <Input
              id="cancel-confirm"
              value={confirmName}
              autoComplete="off"
              onChange={(e) => setConfirmName(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Keep event
            </Button>
            <Button variant="destructive" onClick={submit} disabled={!canSubmit}>
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Cancel event and refund buyers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
