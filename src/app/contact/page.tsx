import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Ticket, Megaphone, ShieldCheck } from 'lucide-react';
import { ArticleHero } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Choice Stubs team — support for ticket buyers, event organizers, and privacy enquiries.',
};

const CHANNELS = [
  {
    icon: Ticket,
    title: 'Ticket buyers',
    body: 'Questions about an order, ticket, transfer, or refund. Include your order number (e.g. TS-2026-0001234) so we can help faster.',
    email: 'support@choicestubs.com',
  },
  {
    icon: Megaphone,
    title: 'Organizers & partnerships',
    body: 'Help with verification, events, payouts — or talk to us before listing your first event.',
    email: 'organizers@choicestubs.com',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy & data protection',
    body: 'Data access, correction, or deletion requests under the Jamaican Data Protection Act, and anything for our Data Protection Officer.',
    email: 'privacy@choicestubs.com',
  },
];

export default function ContactPage() {
  return (
    <>
      <ArticleHero
        eyebrow="Contact"
        title="Talk to a human"
        description="We aim to answer every message within one business day — faster on event days."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="flex flex-col rounded-2xl border border-border/60 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold tracking-tight mb-1">{c.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground flex-1">{c.body}</p>
              <a
                href={`mailto:${c.email}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-2"
              >
                <Mail className="h-4 w-4" />
                {c.email}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Before you write in, the answer might already be in our{' '}
          <Link href="/help" className="text-primary underline-offset-2 hover:underline">
            Help Centre
          </Link>{' '}
          — guides for buyers, organizers, and gate staff, plus an FAQ.
        </p>
      </section>
    </>
  );
}
