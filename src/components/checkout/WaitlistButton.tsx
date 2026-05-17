'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Bell, Loader2 } from 'lucide-react';

interface Props {
  eventId: string;
  tierId?: string;
  tierName: string;
}

export default function WaitlistButton({ eventId, tierId, tierName }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          tierId: tierId ?? null,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Failed to join waitlist (${res.status})`);
      }

      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full mt-1"
      >
        <Bell className="h-3.5 w-3.5 mr-1.5" />
        Join Waitlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Waitlist</DialogTitle>
            <DialogDescription>
              Get notified if a <strong>{tierName}</strong> ticket becomes available.
            </DialogDescription>
          </DialogHeader>

          {joined ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                <p className="font-medium">You&apos;re on the waitlist!</p>
                <p className="mt-1">
                  We&apos;ll email you if a ticket opens up. You&apos;ll have 30 minutes to
                  complete your purchase.
                </p>
              </div>
              <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <Label htmlFor="wl-email" className="text-xs">Email *</Label>
                <Input
                  id="wl-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="wl-phone" className="text-xs">Phone *</Label>
                <Input
                  id="wl-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  disabled={loading || !email.trim() || !phone.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join Waitlist'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
