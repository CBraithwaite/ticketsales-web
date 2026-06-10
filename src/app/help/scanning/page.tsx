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
  title: 'How to Scan Tickets — Gate Staff Guide',
  description:
    'A guide for venue and gate staff: accept your scanner invite, validate QR tickets offline, and sell tickets at the door with Choice Stubs.',
};

export default function ScanningGuidePage() {
  return (
    <>
      <ArticleHero
        eyebrow="Guide for Gate Staff"
        title="How to scan tickets at the gate"
        description="The Choice Stubs scanner runs in your phone's browser, works without signal, and validates a ticket in about two seconds."
      />

      <ArticleBody>
        <ArticleSection title="Getting set up">
          <StepList>
            <Step n={1} title="Accept your invite">
              <p>
                The event organizer sends you an invite by email. Open the link on the phone
                you&apos;ll use at the gate and accept — that phone is now authorized to
                scan for the event.
              </p>
            </Step>
            <Step n={2} title="Open the scanner before you lose signal">
              <p>
                Open the scanner from your invite while you still have internet. It
                downloads the event&apos;s full ticket list to your phone, so it can
                validate tickets even with no connection at the venue. You can also add it
                to your home screen for quick, full-screen access.
              </p>
            </Step>
            <Step n={3} title="Allow camera access">
              <p>
                The first time you scan, your browser asks for camera permission — allow it.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Scanning tickets">
          <StepList>
            <Step n={1} title="Point the camera at the QR code">
              <p>
                Hold the phone steady about 15–20&nbsp;cm from the attendee&apos;s screen or
                printout. The scan happens automatically — no button to press.
              </p>
            </Step>
            <Step n={2} title="Read the result">
              <p>
                <strong className="text-green-600">Valid</strong> — let them in. The ticket
                is marked as used instantly.
              </p>
              <p>
                <strong className="text-amber-600">Already scanned</strong> — this QR code
                was used before. The screen shows when it was first scanned; don&apos;t
                admit without checking with a supervisor.
              </p>
              <p>
                <strong className="text-red-600">Invalid</strong> — the code isn&apos;t a
                real ticket for this event (wrong event, forged, or a transferred-away
                ticket). Don&apos;t admit.
              </p>
            </Step>
            <Step n={3} title="Keep scanning — online or not">
              <p>
                If the venue has no signal, keep scanning normally. Results are stored on
                your phone and sync back automatically when the connection returns, so the
                organizer&apos;s live stats catch up on their own.
              </p>
            </Step>
          </StepList>

          <div className="mt-8">
            <Tip>
              Charge your phone fully and turn the screen brightness up before doors open.
              A portable power bank is a good idea for long events.
            </Tip>
          </div>
        </ArticleSection>

        <ArticleSection title="Selling tickets at the door">
          <p>
            If the organizer gave you door-sale permission, you&apos;ll see a{' '}
            <strong>Sell Tickets at Door</strong> button on your scanner dashboard:
          </p>
          <StepList>
            <Step n={1} title="Pick the tier and quantity">
              <p>Choose what the buyer wants from the available tiers.</p>
            </Step>
            <Step n={2} title="Collect cash and confirm">
              <p>
                The app shows the total to collect. Confirm the sale once you&apos;ve
                received payment, or issue the tickets as comps if the organizer told you
                to.
              </p>
            </Step>
            <Step n={3} title="Show the buyer their QR code">
              <p>
                The ticket QR code appears on your screen for the buyer to scan in — or scan
                it yourself and wave them through. Your sales tally for the day is shown on
                the sell screen.
              </p>
            </Step>
          </StepList>
        </ArticleSection>

        <ArticleSection title="Troubleshooting">
          <p>
            <strong className="text-foreground">Camera won&apos;t start:</strong> check that
            the browser has camera permission in your phone settings, then reload the page.
          </p>
          <p>
            <strong className="text-foreground">QR won&apos;t scan:</strong> ask the
            attendee to raise their screen brightness and close other apps; smudged screens
            and cracked glass slow scans down.
          </p>
          <p>
            <strong className="text-foreground">Lost your invite link:</strong> ask the
            organizer to re-send your invite — links are personal, so don&apos;t share
            yours.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" className="rounded-sm">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </ArticleSection>
      </ArticleBody>
    </>
  );
}
