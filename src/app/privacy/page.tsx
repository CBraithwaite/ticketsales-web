import type { Metadata } from 'next';
import { ArticleHero, ArticleBody, ArticleSection } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Choice Stubs collects, uses, and protects your personal data under the Jamaican Data Protection Act, 2020.',
};

export default function PrivacyPage() {
  return (
    <>
      <ArticleHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: 9 June 2026"
      />

      <ArticleBody>
        <ArticleSection title="1. Overview">
          <p>
            This policy explains how Choice Stubs (&quot;we&quot;, &quot;us&quot;) collects
            and uses personal data when you use choicestubs.com. We process personal data in
            accordance with the Jamaican Data Protection Act, 2020 (&quot;DPA&quot;).
          </p>
        </ArticleSection>

        <ArticleSection title="2. What we collect">
          <p>
            <strong className="text-foreground">Buyers:</strong> name, email address, phone
            number, order and ticket history. Payment card details are handled by our
            payment processor — we never store full card numbers.
          </p>
          <p>
            <strong className="text-foreground">Organizers:</strong> business name, contact
            details, tax registration number, government-issued ID submitted for
            verification, and bank payout details (stored encrypted).
          </p>
          <p>
            <strong className="text-foreground">Gate staff:</strong> the email address an
            organizer invites, and scan activity during events.
          </p>
          <p>
            <strong className="text-foreground">Everyone:</strong> technical data needed to
            run the service securely — IP address, device and browser information, and
            activity logs.
          </p>
        </ArticleSection>

        <ArticleSection title="3. How we use it">
          <p>
            We use personal data to process orders and deliver tickets, verify organizers
            and prevent fraud, operate gate scanning and live event statistics, pay
            organizers, provide customer support, send transactional emails (order
            confirmations, transfers, refunds, password resets), and meet legal
            obligations such as tax records. We do not sell personal data.
          </p>
          <p>
            Organizers receive the attendee information needed to run their event (such as
            names on the guest list and order details for their own events) and must use it
            only for that purpose.
          </p>
        </ArticleSection>

        <ArticleSection title="4. Sharing">
          <p>
            We share data with service providers who help us operate the platform —
            payment processing, email delivery, and cloud hosting — under contracts that
            restrict their use of it. We disclose data where required by law or to protect
            the platform and its users. Some providers process data outside Jamaica; where
            they do, we take steps to ensure an adequate level of protection as required by
            the DPA.
          </p>
        </ArticleSection>

        <ArticleSection title="5. Retention">
          <p>
            We keep order and payout records for as long as needed to provide the service
            and to satisfy legal, tax, and audit obligations, then delete or anonymize
            them. Verification documents are retained only as long as needed to maintain
            an organizer&apos;s verified status and meet legal requirements.
          </p>
        </ArticleSection>

        <ArticleSection title="6. Your rights">
          <p>Under the DPA you have the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>access a copy of the personal data we hold about you;</li>
            <li>have inaccurate data rectified;</li>
            <li>request erasure of data we no longer need to keep;</li>
            <li>object to certain processing, including direct marketing;</li>
            <li>complain to the Office of the Information Commissioner.</li>
          </ul>
          <p>
            To exercise any of these rights, email{' '}
            <a
              href="mailto:privacy@choicestubs.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              privacy@choicestubs.com
            </a>
            . We respond within the timelines the DPA requires.
          </p>
        </ArticleSection>

        <ArticleSection title="7. Security and breach notification">
          <p>
            We protect personal data with encryption in transit, encrypted storage of
            sensitive fields, role-based access controls, and audit logging. If a data
            breach is likely to harm your rights, we will notify the Information
            Commissioner within 72 hours of becoming aware of it and inform affected users
            without undue delay.
          </p>
        </ArticleSection>

        <ArticleSection title="8. Cookies">
          <p>
            We use strictly necessary cookies to keep you signed in and to secure checkout
            sessions. We do not use third-party advertising cookies.
          </p>
        </ArticleSection>

        <ArticleSection title="9. Data Protection Officer">
          <p>
            Our Data Protection Officer can be reached at{' '}
            <a
              href="mailto:privacy@choicestubs.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              privacy@choicestubs.com
            </a>
            .
          </p>
        </ArticleSection>

        <ArticleSection title="10. Changes">
          <p>
            We may update this policy from time to time; material changes will be announced
            on the platform or by email, and the &quot;last updated&quot; date above will
            change.
          </p>
        </ArticleSection>
      </ArticleBody>
    </>
  );
}
