import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArticleHero,
  ArticleBody,
  ArticleSection,
  Step,
  StepList,
  Tip,
} from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'How to Buy Tickets',
  description:
    'A step-by-step guide to finding events, checking out, and using your QR tickets on Choice Stubs — plus transfers, refunds, and waitlists.',
};

export default function BuyerGuidePage() {
  return (
    <>
      <ArticleHero
        eyebrow="Guide for Ticket Buyers"
        title="How to buy and use your tickets"
        description="From finding an event to walking through the gate — everything you need to know, in five minutes."
      />

      <ArticleBody>
        <ArticleSection title="Buying tickets">
          <StepList>
            <Step n={1} title="Find your event">
              <p>
                Browse upcoming events on the{' '}
                <Link href="/" className="text-primary underline-offset-2 hover:underline">
                  homepage
                </Link>
                . Filter by category — dancehall, reggae, festivals, comedy, and more — or
                by country. Open an event to see the venue, date, lineup details, and
                available ticket tiers.
              </p>
            </Step>

            <Step n={2} title="Choose your tickets">
              <p>
                Pick a tier (for example General, VIP, or Early Bird) and how many tickets
                you want. Some tiers only sell during a set window or have per-order limits.
                Got a promo code? Enter it before checkout to see your discount applied.
              </p>
            </Step>

            <Step n={3} title="Check out securely">
              <p>
                Enter your name, email, and phone number — no account required — and
                you&apos;ll be taken to our secure payment page to pay by card. The order
                summary shows the ticket price and the service fee as separate lines, so
                you always see the full cost before paying.
              </p>
            </Step>

            <Step n={4} title="Get your QR tickets">
              <p>
                Once payment is confirmed you land on a confirmation page showing each
                ticket&apos;s QR code, and we email copies to you. If you have an account,
                your tickets also appear under{' '}
                <Link
                  href="/me/tickets"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  My Tickets
                </Link>{' '}
                any time.
              </p>
            </Step>

            <Step n={5} title="At the gate">
              <p>
                Show your QR code on your phone (or a printout) at the entrance. Turn your
                screen brightness up for a faster scan. Each QR code admits one person, once
                — after it&apos;s scanned, it can&apos;t be reused.
              </p>
            </Step>
          </StepList>

          <div className="mt-8">
            <Tip>
              Save your confirmation email. It contains your order number and ticket QR
              codes, and works even if you checked out as a guest.
            </Tip>
          </div>
        </ArticleSection>

        <ArticleSection title="Transferring a ticket to someone else">
          <p>
            If the event allows transfers, you can pass a ticket to a friend safely —
            without forwarding screenshots:
          </p>
          <StepList>
            <Step n={1} title="Start the transfer">
              <p>
                Open the ticket in <strong>My Tickets</strong> and choose{' '}
                <strong>Transfer</strong>. Enter the recipient&apos;s details to generate a
                secure transfer link.
              </p>
            </Step>
            <Step n={2} title="Send the link">
              <p>Share the link with the recipient by WhatsApp, text, or email.</p>
            </Step>
            <Step n={3} title="They accept">
              <p>
                When the recipient opens the link and accepts, a <strong>new</strong> QR
                code is issued in their name — and your original QR code is invalidated
                immediately. Only the new code works at the gate.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Requesting a refund">
          <p>
            Each organizer sets the refund policy for their event. If refunds are
            available:
          </p>
          <StepList>
            <Step n={1} title="Submit a request">
              <p>
                Open your order in <strong>My Tickets</strong> and choose{' '}
                <strong>Request Refund</strong>, adding a short reason.
              </p>
            </Step>
            <Step n={2} title="Organizer reviews">
              <p>
                The event organizer approves or declines your request. You&apos;ll be
                notified either way.
              </p>
            </Step>
            <Step n={3} title="Money returned">
              <p>
                Approved refunds are returned to your original payment method. Card refunds
                typically take 5–10 business days to appear, depending on your bank.
              </p>
            </Step>
          </StepList>
          <p>
            If an event is cancelled outright, you don&apos;t need to do anything — orders
            for cancelled events are refunded.
          </p>
        </ArticleSection>

        <ArticleSection title="Sold out? Join the waitlist">
          <p>
            When a tier or event sells out, a <strong>Join Waitlist</strong> button appears
            on the event page. Leave your email and we&apos;ll let you know if tickets
            become available again — from cancellations, released holds, or added
            inventory. Joining the waitlist doesn&apos;t reserve a ticket, so act fast when
            you get the email.
          </p>
        </ArticleSection>

        <ArticleSection title="Need more help?">
          <p>
            Check the{' '}
            <Link href="/help" className="text-primary underline-offset-2 hover:underline">
              Help Centre FAQ
            </Link>{' '}
            or get in touch — include your order number (it looks like{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TS-2026-0001234</code>)
            so we can help faster.
          </p>
          <Button asChild variant="outline" className="rounded-sm mt-2">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </ArticleSection>
      </ArticleBody>
    </>
  );
}
