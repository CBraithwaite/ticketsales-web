import { redirect } from 'next/navigation';
import { authedFetch } from '@/lib/server-fetch';
import OrganizerVerificationQueue from '@/components/admin/OrganizerVerificationQueue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle, Inbox } from 'lucide-react';

export const metadata = { title: 'Admin · TicketSales' };

interface AdminOrganizer {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxRegistrationNumber: string | null;
  verificationStatus: string;
  createdAt: string;
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
    </div>
  );
}
