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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Ticket {
  id: string;
  tierName: string;
  order: { eventName: string };
}

interface Props {
  ticket: Ticket;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ ticket, accessToken, onClose, onSuccess }: Props) {
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/tickets/${ticket.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          toName: toName.trim(),
          toEmail: toEmail.trim().toLowerCase(),
          toPhone: toPhone.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Transfer failed (${res.status})`);
      }

      setSent(true);
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
          <DialogTitle>Transfer Ticket</DialogTitle>
          <DialogDescription>
            {ticket.tierName} · {ticket.order.eventName}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-medium">Transfer link sent!</p>
              <p className="mt-1">
                {toName} will receive an email and SMS with a link to accept the ticket.
                The link expires in 24 hours.
              </p>
              <p className="mt-1 text-xs">
                Your original ticket has been invalidated and will be replaced once the recipient accepts.
              </p>
            </div>
            <Button className="w-full" onClick={onSuccess}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              The recipient will receive a link to accept the ticket. Your QR code will be
              invalidated once they accept.
            </p>

            <div>
              <Label htmlFor="transfer-name" className="text-xs">Recipient&apos;s full name *</Label>
              <Input
                id="transfer-name"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="John Brown"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="transfer-email" className="text-xs">Recipient&apos;s email *</Label>
              <Input
                id="transfer-email"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="transfer-phone" className="text-xs">Recipient&apos;s phone *</Label>
              <Input
                id="transfer-phone"
                type="tel"
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="+1 876 555 0100"
                required
                className="mt-1"
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
                className="flex-1"
                disabled={loading || !toName.trim() || !toEmail.trim() || !toPhone.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Transfer'}
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
