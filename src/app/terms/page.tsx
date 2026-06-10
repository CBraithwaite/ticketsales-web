import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleHero, ArticleBody, ArticleSection } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of Choice Stubs — buying tickets, organizing events, payments, refunds, and more.',
};

export default function TermsPage() {
  return (
    <>
      <ArticleHero
        eyebrow="Legal"
        title="Terms of Service"
        description="Last updated: 9 June 2026"
      />

      <ArticleBody>
        <ArticleSection title="1. Who we are">
          <p>
            Choice Stubs (&quot;Choice Stubs&quot;, &quot;we&quot;, &quot;us&quot;) operates
            an online ticketing platform at choicestubs.com that lets event organizers
            (&quot;Organizers&quot;) list events and sell tickets, and lets buyers
            (&quot;Buyers&quot;) discover events and purchase tickets. By using the
            platform you agree to these terms.
          </p>
        </ArticleSection>

        <ArticleSection title="2. Our role">
          <p>
            Choice Stubs is a marketplace and ticketing agent, not the event organizer.
            Events are created, priced, and run by their Organizers, who are responsible
            for the event taking place as advertised, admission policies, and the conduct
            of the event. We process ticket sales, issue QR-coded tickets, and provide
            scanning and payout tools.
          </p>
        </ArticleSection>

        <ArticleSection title="3. Accounts">
          <p>
            You can buy tickets as a guest, but some features (ticket management, transfers,
            refund requests, organizing events) require an account. You are responsible for
            keeping your credentials confidential and for activity under your account. You
            must provide accurate information and be at least 18 years old to organize
            events or make purchases.
          </p>
        </ArticleSection>

        <ArticleSection title="4. Tickets and entry">
          <p>
            Each ticket is issued as a unique, single-use QR code. Admission is granted to
            the first valid scan of a ticket; copied or screenshotted codes that have
            already been scanned will be refused. Tickets may not be resold for profit.
            Where an event allows transfers, tickets may be transferred only through the
            platform&apos;s transfer feature, which invalidates the original QR code and
            issues a new one to the recipient.
          </p>
          <p>
            Organizers may set age restrictions, dress codes, and other admission
            conditions, which are displayed on the event page and form part of your
            purchase.
          </p>
        </ArticleSection>

        <ArticleSection title="5. Pricing, fees, and taxes">
          <p>
            Ticket prices are set by Organizers. Choice Stubs adds a payment processing
            fee (currently 2.99% of the ticket price) and a service fee (currently a fixed
            per-ticket amount of CAD&nbsp;1.20 or its equivalent in the order currency),
            each itemized at checkout before payment. Where
            applicable, General Consumption Tax (GCT) is shown separately on receipts.
            Organizers are responsible for GCT on ticket face value where their turnover
            meets the statutory threshold. See{' '}
            <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">
              Pricing &amp; Fees
            </Link>
            .
          </p>
        </ArticleSection>

        <ArticleSection title="6. Payments">
          <p>
            Payments are processed by third-party payment providers. We do not store full
            card numbers. An order is confirmed only when payment is captured and a
            confirmation with ticket QR codes is issued.
          </p>
        </ArticleSection>

        <ArticleSection title="7. Refunds and cancellations">
          <p>
            Refund policies are set per event by the Organizer. Refund requests are
            submitted through the platform and decided by the Organizer. If an event is
            cancelled, orders for that event will be refunded to the original payment
            method. Choice Stubs may issue platform-level refunds where an Organizer is
            unresponsive or in cases of fraud. Service fees on refunded orders may be
            non-refundable except where required by law.
          </p>
        </ArticleSection>

        <ArticleSection title="8. Organizer obligations">
          <p>
            Organizers must complete identity and payout verification before publishing
            paid events, must hold any licences or permissions their event requires, must
            honour the refund policy they advertise, and are responsible for the accuracy
            of their event listings. Payouts of net ticket revenue are made to the
            Organizer&apos;s verified bank account after the event ends and a settling
            period (currently 72 hours) elapses. We may withhold or offset payouts to cover
            refunds, chargebacks, or suspected fraud.
          </p>
        </ArticleSection>

        <ArticleSection title="9. Prohibited conduct">
          <p>
            You must not: resell tickets in breach of these terms; create counterfeit or
            duplicate tickets; use the platform for unlawful events or money laundering;
            interfere with the platform&apos;s operation or security; or misuse scanner
            access. We may suspend accounts, freeze events, cancel orders, and withhold
            payouts involved in suspected breaches.
          </p>
        </ArticleSection>

        <ArticleSection title="10. Liability">
          <p>
            To the fullest extent permitted by law, Choice Stubs is not liable for the
            acts or omissions of Organizers, the cancellation, postponement, or quality of
            events, or indirect or consequential losses. Our total liability for any claim
            relating to an order is limited to the amount you paid for that order. Nothing
            in these terms excludes liability that cannot be excluded under Jamaican law.
          </p>
        </ArticleSection>

        <ArticleSection title="11. Privacy">
          <p>
            Our{' '}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>{' '}
            explains how we handle personal data in accordance with the Jamaican Data
            Protection Act, 2020.
          </p>
        </ArticleSection>

        <ArticleSection title="12. Changes to these terms">
          <p>
            We may update these terms from time to time. Material changes will be notified
            on the platform or by email, and the &quot;last updated&quot; date above will
            change. Continued use after changes take effect constitutes acceptance.
          </p>
        </ArticleSection>

        <ArticleSection title="13. Governing law">
          <p>
            These terms are governed by the laws of Jamaica, and the courts of Jamaica have
            exclusive jurisdiction over any dispute arising from them or from use of the
            platform.
          </p>
        </ArticleSection>

        <ArticleSection title="14. Contact">
          <p>
            Questions about these terms:{' '}
            <a
              href="mailto:support@choicestubs.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              support@choicestubs.com
            </a>
            .
          </p>
        </ArticleSection>
      </ArticleBody>
    </>
  );
}
