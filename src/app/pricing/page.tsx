import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleHero, FaqItem } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'Pricing & Fees',
  description:
    'Transparent pricing on Choice Stubs: free to list events, a 2.99% + CA$1.20-per-ticket service fee paid by the buyer at checkout, and no platform fee on door cash sales.',
};

const ORGANIZER_POINTS = [
  'Free to create and publish events — no setup or monthly cost',
  'Unlimited ticket tiers, sale windows, and promo codes',
  'Free offline-capable QR scanning for your gate staff',
  'Real-time live console on event night',
  'No platform fee on door cash sales — you keep 100%',
  'Payouts to your local bank account after a 72-hour settling period',
];

const BUYER_POINTS = [
  'Ticket price + a small service fee, itemized before you pay',
  'No hidden charges — the total at checkout is what you pay',
  'Secure card payments',
  'Tickets delivered instantly by email with QR codes',
  'Free ticket transfers where the event allows them',
];

export default function PricingPage() {
  return (
    <>
      <ArticleHero
        eyebrow="Pricing & Fees"
        title="Simple, transparent pricing"
        description="No subscriptions, no setup costs, no surprises. One service fee, always shown before payment."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Organizers */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              For Organizers
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold tracking-tight">Free</span>
              <span className="text-sm text-muted-foreground">to list and sell</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The service fee is added on top of your ticket price and paid by the
              buyer — you keep your full ticket face value on online sales.
            </p>
            <ul className="mt-6 space-y-3">
              {ORGANIZER_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full rounded-sm font-semibold">
              <Link href="/organizer/apply">Start Selling</Link>
            </Button>
          </div>

          {/* Buyers */}
          <div className="rounded-2xl border border-border/60 p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              For Ticket Buyers
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold tracking-tight">2.99%</span>
              <span className="text-sm text-muted-foreground">+ CA$1.20 per ticket</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The 2.99% covers credit card processing; the CA$1.20 per ticket (charged in
              your order&apos;s currency — about J$140 for JMD events) is the service fee
              that keeps the platform running. Both are itemized before you pay.
            </p>
            <ul className="mt-6 space-y-3">
              {BUYER_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-8 w-full rounded-sm font-semibold">
              <Link href="/">Browse Events</Link>
            </Button>
          </div>
        </div>

        {/* Example */}
        <div className="mt-10 rounded-2xl border border-border/60 bg-muted/20 p-8">
          <h2 className="font-display text-lg font-bold tracking-tight mb-4">
            Example: a J$5,000 ticket
          </h2>
          <div className="max-w-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket price (set by organizer)</span>
              <span className="font-medium">J$5,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit card processing (2.99%)</span>
              <span className="font-medium">J$149.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service fee</span>
              <span className="font-medium">J$140.00</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Buyer pays</span>
              <span>J$5,289.50</span>
            </div>
            <div className="flex justify-between text-primary font-semibold">
              <span>Organizer earns</span>
              <span>J$5,000.00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">
            Pricing questions
          </h2>
          <div className="space-y-3">
            <FaqItem question="Are there fees on free events?">
              <p>
                No. If the ticket price is zero, the service fee is zero — free events are
                completely free to run and attend.
              </p>
            </FaqItem>
            <FaqItem question="What about door sales?">
              <p>
                Cash sales recorded at the door through the scanner app carry no platform
                fee — the organizer keeps 100% of door revenue. Comps (complimentary
                tickets) are free to issue and tracked separately.
              </p>
            </FaqItem>
            <FaqItem question="How does GCT apply?">
              <p>
                Where applicable, GCT (15%) is shown separately on receipts. Organizers
                whose turnover exceeds the GCT threshold are responsible for GCT on ticket
                face value and can configure whether their pricing is GCT-inclusive or
                exclusive.
              </p>
            </FaqItem>
            <FaqItem question="When do payouts arrive?">
              <p>
                After your event ends and the 72-hour settling period passes, payouts are
                sent by local bank transfer (NCB, Scotiabank, JN, Sagicor, and others) for
                JMD. Status and downloadable statements are in your organizer dashboard.
              </p>
            </FaqItem>
            <FaqItem question="What happens to fees when an order is refunded?">
              <p>
                Approved refunds return the buyer&apos;s payment to their original payment
                method. Refunded orders don&apos;t count toward your payout.
              </p>
            </FaqItem>
          </div>
        </div>
      </section>
    </>
  );
}
