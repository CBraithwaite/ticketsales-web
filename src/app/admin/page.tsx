import { redirect } from 'next/navigation';
import { authedFetch } from '@/lib/server-fetch';
import OrganizerVerificationQueue from '@/components/admin/OrganizerVerificationQueue';
import OrganizerActionList from '@/components/admin/OrganizerActionList';
import AdminEventList from '@/components/admin/AdminEventList';
import type { AdminEventItem } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle, Inbox } from 'lucide-react';

export const metadata = { title: 'Admin · Choice Stubs' };

interface AdminOrganizer {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxRegistrationNumber: string | null;
  verificationStatus: string;
  createdAt: string;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
}

export default async function AdminPage() {
  const pendingRes = await authedFetch('/api/v1/admin/organizers/pending');

  if (pendingRes.status === 401) redirect('/login?next=/admin');
  if (pendingRes.status === 403) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">You do not have admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!pendingRes.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">Failed to load data (status {pendingRes.status}).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pending = (await pendingRes.json()) as AdminOrganizer[];
  const approvedRes = await authedFetch('/api/v1/admin/organizers?status=Approved');
  const approved = approvedRes.ok ? ((await approvedRes.json()) as AdminOrganizer[]) : null;
  const rejectedRes = await authedFetch('/api/v1/admin/organizers?status=Rejected');
  const rejected = rejectedRes.ok ? ((await rejectedRes.json()) as AdminOrganizer[]) : null;
  const eventsRes = await authedFetch('/api/v1/admin/events');
  const events = eventsRes.ok ? ((await eventsRes.json()) as AdminEventItem[]) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
          <Shield className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Platform administration</p>
        </div>
      </header>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Pending Verifications</h2>
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
          )}
        </div>

        {pending.length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No organizer applications awaiting review.</p>
            </CardContent>
          </Card>
        ) : (
          <OrganizerVerificationQueue organizers={pending} />
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Approved Organizers</h2>
        <p className="text-sm text-muted-foreground">
          Revoking approval pauses ticket sales on the organizer&apos;s events and blocks payouts.
        </p>
        {approved ? (
          // Keyed on the ids so a decision elsewhere on the page shows up here after router.refresh().
          <OrganizerActionList key={approved.map((o) => o.id).join()} organizers={approved} mode="revoke" />
        ) : (
          <p className="mt-4 text-sm text-destructive">Failed to load organizers (status {approvedRes.status}).</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Rejected Organizers</h2>
        <p className="text-sm text-muted-foreground">
          Reinstating restores organizer access and resumes ticket sales on their events.
        </p>
        {rejected ? (
          <OrganizerActionList key={rejected.map((o) => o.id).join()} organizers={rejected} mode="reinstate" />
        ) : (
          <p className="mt-4 text-sm text-destructive">Failed to load organizers (status {rejectedRes.status}).</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Events</h2>
        <p className="text-sm text-muted-foreground">
          Cancelling an event refunds every buyer in full, fees included.
        </p>
        {events ? (
          <AdminEventList events={events} />
        ) : (
          <p className="mt-4 text-sm text-destructive">Failed to load events (status {eventsRes.status}).</p>
        )}
      </section>
    </div>
  );
}
