import Link from 'next/link';
import { auth } from '@/auth';
import { authedFetch } from '@/lib/server-fetch';
import SignOutButton from '@/components/auth/SignOutButton';
import ChangePasswordCard from '@/components/auth/ChangePasswordCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, IdCard } from 'lucide-react';

export const metadata = { title: 'My account · Choice Stubs' };

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  phoneE164: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  roles: string[];
  hasPassword: boolean;
}

export default async function MePage() {
  const session = await auth();
  let me: MeResponse | null = null;
  let apiError: string | null = null;

  try {
    const res = await authedFetch('/api/v1/me');
    if (res.ok) {
      me = (await res.json()) as MeResponse;
    } else {
      apiError = `API responded with ${res.status}`;
    }
  } catch (err) {
    apiError = err instanceof Error ? err.message : 'Unknown error';
  }

  const isOrganizer = !!me?.roles.includes('Organizer');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>
        <SignOutButton />
      </header>

      {me && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {me.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{me.fullName}</h2>
                <div className="flex flex-wrap gap-1 mt-1">
                  {me.roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <dl className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium">
                    {me.email}
                    {!me.isEmailVerified && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                        unverified
                      </Badge>
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="text-sm font-medium">{me.phoneE164 ?? <span className="text-muted-foreground">Not set</span>}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IdCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">User ID</dt>
                  <dd><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{me.id}</code></dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {me?.hasPassword && <ChangePasswordCard email={me.email} />}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/me/tickets">My Tickets</Link>
        </Button>
        {isOrganizer ? (
          <Button asChild variant="outline">
            <Link href="/organizer">Organizer Dashboard</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/organizer/apply">Become an Organizer</Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/">Browse Events</Link>
        </Button>
      </div>

      {apiError && (
        <Card className="mt-6 border-destructive bg-destructive/10">
          <CardContent className="p-3 text-sm text-destructive">
            <p className="font-semibold">Could not load profile.</p>
            <p className="mt-1">{apiError}</p>
          </CardContent>
        </Card>
      )}

      {session?.error === 'RefreshAccessTokenError' && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-3 text-sm text-yellow-800">
            Your session has expired. Please sign in again.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
