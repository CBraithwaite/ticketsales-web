'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const Schema = z.object({
  toName: z.string().min(1, 'Recipient name is required'),
  toEmail: z.string().email('Enter a valid email address'),
  toPhone: z.string().min(1, 'Recipient phone is required'),
});
type FormValues = z.infer<typeof Schema>;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [recipientName, setRecipientName] = useState('');

  const form = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormValues) => {
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
          toName: data.toName.trim(),
          toEmail: data.toEmail.trim().toLowerCase(),
          toPhone: data.toPhone.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Transfer failed (${res.status})`);
      }

      setRecipientName(data.toName.trim());
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
                {recipientName} will receive an email and SMS with a link to accept the ticket.
                The link expires in 24 hours.
              </p>
              <p className="mt-1 text-xs">
                Your original ticket has been invalidated and will be replaced once the recipient accepts.
              </p>
            </div>
            <Button className="w-full" onClick={onSuccess}>Done</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                The recipient will receive a link to accept the ticket. Your QR code will be
                invalidated once they accept.
              </p>

              <FormField
                control={form.control}
                name="toName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Recipient&apos;s full name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Brown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Recipient&apos;s email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Recipient&apos;s phone *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 876 555 0100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Transfer'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
