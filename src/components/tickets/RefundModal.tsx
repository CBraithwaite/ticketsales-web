'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Ticket {
  id: string;
  tierName: string;
  order: { orderNumber: string; eventName: string };
}

interface Props {
  ticket: Ticket;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ ticket, accessToken, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/orders/${ticket.order.orderNumber}/refund-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ticketIds: [ticket.id],
            reason: reason.trim(),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Refund request failed (${res.status})`);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Refund</DialogTitle>
          <DialogDescription>
            {ticket.tierName} · {ticket.order.eventName}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              <p className="font-medium">Refund request submitted</p>
              <p className="mt-1">
                Your request has been sent to the organiser for review. You&apos;ll hear back
                within 72 hours.
              </p>
            </div>
            <Button className="w-full" onClick={onSuccess}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Refund eligibility depends on the event&apos;s refund policy. Your ticket will
              remain active until the request is approved.
            </p>

            <div>
              <Label htmlFor="refund-reason" className="text-xs">Reason for refund *</Label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please briefly explain why you need a refund…"
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={loading || !reason.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
