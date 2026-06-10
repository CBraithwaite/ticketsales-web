'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, Mail, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';

const Schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof Schema>;

interface Ticket {
  id: string;
  tierName: string;
  order: {
    eventName: string;
    eventStartsAt: string;
    venueName: string;
    confirmationToken: string;
  };
}

interface Props {
  ticket: Ticket;
  accessToken: string;
  onClose: () => void;
}

export default function ShareTicketModal({ ticket, accessToken, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const viewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/tickets/${ticket.order.confirmationToken}`
      : '';

  const whatsappMessage =
    `🎟️ ${ticket.order.eventName}\n` +
    `${ticket.tierName} · ${ticket.order.venueName}\n\n` +
    `View the ticket here:\n${viewUrl}`;

  const onWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const onCopy = async () => {
    await navigator.clipboard.writeText(viewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onEmail = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/tickets/${ticket.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Send failed (${res.status})`);
      }
      setSentTo(data.email.trim().toLowerCase());
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
          <DialogTitle>Send Ticket</DialogTitle>
          <DialogDescription>
            {ticket.tierName} · {ticket.order.eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* WhatsApp + copy link */}
          <div className="space-y-2">
            <Button
              type="button"
              className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1faf55] border-0"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>
            <Button type="button" variant="outline" className="w-full gap-2" onClick={onCopy}>
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Link copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy ticket link
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              The link opens the ticket view for this order — anyone with it can see all
              QR codes on the order.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or send by email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email */}
          {sentTo ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-medium">Ticket sent!</p>
              <p className="mt-1">
                This ticket&apos;s PDF was emailed to <strong>{sentTo}</strong>.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEmail)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Recipient&apos;s email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="friend@example.com" {...field} />
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
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" /> Email this ticket
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <p className="text-xs text-muted-foreground">
            Sending shares a copy of the QR code — each code admits one person, once. To
            permanently give this ticket to someone else, use <strong>Transfer</strong>{' '}
            instead.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
