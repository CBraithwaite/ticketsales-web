import type { Metadata } from 'next';
import Link from 'next/link';
import { Ticket, Megaphone, ScanLine, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleHero, FaqItem, GuideLinkCard } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'Help Centre',
  description:
    'Guides for buying tickets, organizing events, and scanning at the gate on Choice Stubs.',
};

export default function HelpPage() {
  return (
    <>
      <ArticleHero
        eyebrow="Help Centre"
        title="How can we help?"
        description="Step-by-step guides for ticket buyers, event organizers, and gate staff — plus answers to the questions we hear most."
      />

      {/* Guides */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <GuideLinkCard
            href="/help/buyers"
            icon={Ticket}
            title="Buying Tickets"
            description="Find events, check out securely, get your QR tickets, and learn how transfers, refunds, and waitlists work."
          />
          <GuideLinkCard
            href="/help/organizers"
            icon={Megaphone}
            title="Organizing Events"
            description="Get verified, create and publish events, set up ticket tiers and promo codes, run event day, and get paid."
          />
          <GuideLinkCard
            href="/help/scanning"
            icon={ScanLine}
            title="Scanning at the Gate"
            description="Accept a scanner invite, install the scanner on your phone, validate tickets offline, and sell at the door."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            FAQ
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl mb-8">
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            <FaqItem question="Do I need an account to buy tickets?">
              <p>
                No — you can check out as a guest with just your name, email, and phone
                number. Your tickets are emailed to you. Creating an account lets you see
                all your tickets in one place under <strong>My Tickets</strong> and makes
                transfers and refund requests easier.
              </p>
            </FaqItem>

            <FaqItem question="How do I get my tickets after paying?">
              <p>
                As soon as your payment is confirmed you&apos;ll see your tickets with QR
                codes on the confirmation page, and we email a copy to the address you
                provided. Each ticket has its own QR code — one scan per entry.
              </p>
            </FaqItem>

            <FaqItem question="What fees do you charge?">
              <p>
                Checkout adds a 2.99% credit card processing fee plus a CA$1.20 service fee
                per ticket (charged in your order&apos;s currency — about J$140 for JMD
                events), each shown as its own line before you pay. Listing an event is
                free for organizers, and cash sales at the door carry no platform fee.
                See{' '}
                <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">
                  Pricing &amp; Fees
                </Link>{' '}
                for details.
              </p>
            </FaqItem>

            <FaqItem question="Can I get a refund?">
              <p>
                Refund availability is set by the event organizer. You can request a refund
                from <strong>My Tickets</strong> (or from your order confirmation), and the
                organizer reviews and approves or declines it. Approved refunds go back to
                your original payment method.
              </p>
            </FaqItem>

            <FaqItem question="Can I give my ticket to someone else?">
              <p>
                Yes, if the event allows transfers. Open the ticket in{' '}
                <strong>My Tickets</strong>, choose <strong>Transfer</strong>, and send the
                link to the recipient. When they accept, they get a brand-new QR code and
                your old one stops working — so a forwarded screenshot can&apos;t be used
                twice.
              </p>
            </FaqItem>

            <FaqItem question="The event is sold out — now what?">
              <p>
                Join the waitlist on the event page. If tickets free up (cancellations,
                released holds, or added inventory), we&apos;ll notify you by email.
              </p>
            </FaqItem>

            <FaqItem question="What does it cost to sell tickets on Choice Stubs?">
              <p>
                Nothing upfront. Creating and publishing events is free; the card
                processing fee (2.99%) and service fee (CA$1.20 per ticket) are paid by the
                buyer on top of your ticket price, so you keep your full ticket face value
                on online sales. Door cash sales have no platform fee at all.
              </p>
            </FaqItem>

            <FaqItem question="When do organizers get paid?">
              <p>
                After your event ends there&apos;s a 72-hour settling period for refunds and
                chargebacks, then your payout is sent to your verified bank account (NCB,
                Scotiabank, JN, Sagicor, and other local banks for JMD). You can track payout
                status and download statements from your dashboard.
              </p>
            </FaqItem>

            <FaqItem question="Does ticket scanning work without internet?">
              <p>
                Yes. The scanner app downloads the event&apos;s ticket list ahead of time and
                validates QR codes fully offline, then syncs scans when a connection returns
                — built for venues with weak signal.
              </p>
            </FaqItem>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Still need a hand?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Our support team is happy to help with orders, events, or anything else.
          </p>
          <Button asChild className="mt-5 rounded-sm font-semibold">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
