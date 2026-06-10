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
  title: 'How to Sell Tickets — Organizer Guide',
  description:
    'Everything event organizers need: verification, creating events, ticket tiers, promo codes, scanner staff, door sales, live stats, and payouts on Choice Stubs.',
};

export default function OrganizerGuidePage() {
  return (
    <>
      <ArticleHero
        eyebrow="Guide for Organizers"
        title="How to sell tickets on Choice Stubs"
        description="From verification to payout — set up your event, sell online and at the door, and watch it all live on event night."
      />

      <ArticleBody>
        <ArticleSection title="Getting started">
          <StepList>
            <Step n={1} title="Create an account and apply">
              <p>
                <Link href="/signup" className="text-primary underline-offset-2 hover:underline">
                  Sign up
                </Link>{' '}
                for a free account, then{' '}
                <Link
                  href="/organizer/apply"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  apply to become an organizer
                </Link>
                . You&apos;ll provide your business name, contact details, a
                government-issued ID, and your payout bank details.
              </p>
            </Step>
            <Step n={2} title="Get verified">
              <p>
                Our team reviews your application — verification protects buyers and keeps
                the platform trustworthy. You can draft events while you wait, but
                publishing a paid event requires an approved verification.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Creating your event">
          <StepList>
            <Step n={1} title="Set the basics">
              <p>
                From your{' '}
                <Link href="/organizer" className="text-primary underline-offset-2 hover:underline">
                  organizer dashboard
                </Link>
                , create a new event: name, category, description, venue and address,
                country, dates and times, plus optional details like age restriction and
                dress code. Add a cover image — events with strong artwork sell better.
              </p>
            </Step>
            <Step n={2} title="Build your ticket tiers">
              <p>
                Add one or more tiers — General, VIP, Early Bird, tables — each with its own
                price, inventory cap, and sale window. Sale windows let you run early-bird
                pricing that automatically ends when you choose.
              </p>
            </Step>
            <Step n={3} title="Add promo codes (optional)">
              <p>
                Create percentage or fixed-amount discount codes with usage caps and
                validity windows — great for influencer promotions or early supporters, and
                for tracking where your sales come from.
              </p>
            </Step>
            <Step n={4} title="Publish and share">
              <p>
                Publish when you&apos;re ready and share your event link everywhere. Buyers
                can pay by card from any device, and every ticket is issued with a secure,
                single-use QR code.
              </p>
            </Step>
          </StepList>

          <div className="mt-8">
            <Tip>
              Listing is free — the card processing fee (2.99%) and service fee (CA$1.20
              per ticket) are paid by the buyer on top of your ticket price. See{' '}
              <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">
                Pricing &amp; Fees
              </Link>
              .
            </Tip>
          </div>
        </ArticleSection>

        <ArticleSection title="Preparing for event day">
          <StepList>
            <Step n={1} title="Invite your gate staff">
              <p>
                From your event&apos;s management page, invite scanner staff by email. Each
                person gets a secure link that opens the scanner app on their phone — no
                account setup needed. You decide per person whether they can also sell
                tickets at the door.
              </p>
            </Step>
            <Step n={2} title="Staff install the scanner">
              <p>
                The scanner is a web app that works offline: it downloads the ticket list in
                advance and validates QR codes even with no signal at the venue, syncing
                back when the connection returns. Point staff to the{' '}
                <Link
                  href="/help/scanning"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  scanning guide
                </Link>
                .
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="On event night">
          <StepList>
            <Step n={1} title="Watch the Live Console">
              <p>
                Open <strong>Live</strong> on your event to see real-time sales and
                attendance: tickets sold and scanned per tier, revenue, gate-by-gate
                breakdown, and a live activity feed — refreshed every few seconds.
              </p>
            </Step>
            <Step n={2} title="Sell at the door">
              <p>
                Staff you&apos;ve authorized can record cash sales right in the scanner app
                — the buyer gets a QR code on the spot. You can also issue comps
                (complimentary tickets), which are tracked separately from paid sales. Door
                cash sales carry <strong>no platform fee</strong>.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Refund requests">
          <p>
            If a buyer requests a refund, you&apos;ll see it on your event&apos;s management
            page where you can approve or decline it with a note. Approved refunds are
            returned to the buyer&apos;s original payment method automatically. Handling
            requests promptly keeps buyers confident and chargebacks low.
          </p>
        </ArticleSection>

        <ArticleSection title="Getting paid">
          <StepList>
            <Step n={1} title="Settling period">
              <p>
                After your event ends, a 72-hour hold lets refunds and chargebacks settle.
              </p>
            </Step>
            <Step n={2} title="Payout">
              <p>
                Your net revenue is then paid to your verified bank account — local bank
                transfer (NCB, Scotiabank, JN, Sagicor, and others) for JMD.
              </p>
            </Step>
            <Step n={3} title="Statements">
              <p>
                Track payout status and download statements from{' '}
                <Link
                  href="/organizer/payouts"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  your payouts page
                </Link>{' '}
                — gross sales, fees, and net amounts, itemized per event.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Ready to start?">
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-sm font-semibold">
              <Link href="/organizer/apply">Become an Organizer</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-sm">
              <Link href="/contact">Talk to us first</Link>
            </Button>
          </div>
        </ArticleSection>
      </ArticleBody>
    </>
  );
}
