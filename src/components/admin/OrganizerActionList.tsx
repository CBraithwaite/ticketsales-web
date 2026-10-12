'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Loader2, Building2, Mail, Phone, ShieldOff, ShieldCheck } from 'lucide-react';
import { DEFAULT_TIMEZONE, DEFAULT_LOCALE } from '@/lib/datetime';

interface AdminOrganizer {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
}

type Mode = 'revoke' | 'reinstate';

interface Props {
  organizers: AdminOrganizer[];
  /**
   * revoke    — approved organizers; rejecting removes the Organizer role, pauses ticket
   *             sales on their events and blocks payouts (ticket holders stay covered).
   * reinstate — rejected organizers; approving restores the role and resumes sales.
   */
  mode: Mode;
}

/** Rows rendered at once — search narrows the rest. */
const MAX_SHOWN = 20;

const COPY: Record<Mode, {
  endpoint: 'reject' | 'approve';
  button: string;
  confirm: string;
  question: (name: string) => string;
  consequences: string[];
  placeholder: string;
  reasonRequired: boolean;
  success: (name: string) => string;
  empty: string;
  searchLabel: string;
}> = {
  revoke: {
    endpoint: 'reject',
    button: 'Revoke approval',
    confirm: 'Confirm revoke',
    question: (name) => `Revoke ${name}'s approval?`,
    consequences: [
      'Ticket sales on all their events are paused. The events stay visible.',
      "They can't edit or publish events, create promo codes or comps, or request payouts.",
      'Existing tickets stay valid. They can still refund, cancel events and manage scanners.',
      'You can reinstate them later to restore everything.',
    ],
    placeholder: 'Reason (required — shown to the organizer)',
    reasonRequired: true,
    success: (name) => `${name}'s approval has been revoked. Ticket sales on their events are paused.`,
    empty: 'No approved organizers.',
    searchLabel: 'Search approved organizers',
  },
  reinstate: {
    endpoint: 'approve',
    button: 'Reinstate',
    confirm: 'Confirm reinstate',
    question: (name) => `Reinstate ${name}?`,
    consequences: [
      'They get organizer access back: creating and editing events, promo codes, comps and payouts.',
      'Ticket sales resume on any of their published events.',
    ],
    placeholder: 'Optional note (saved with the decision)',
    reasonRequired: false,
    success: (name) => `${name} has been reinstated. Ticket sales on their events have resumed.`,
    empty: 'No rejected organizers.',
    searchLabel: 'Search rejected organizers',
  },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function OrganizerActionList({ organizers: initial, mode }: Props) {
  const copy = COPY[mode];
  const router = useRouter();
  const { data: session } = useSession();
  const [organizers, setOrganizers] = useState(initial);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = q
    ? organizers.filter((o) =>
        [o.businessName, o.contactName, o.contactEmail].some((v) => v.toLowerCase().includes(q)))
    : organizers;
  const shown = matches.slice(0, MAX_SHOWN);

  const open = (id: string) => {
    setActingId(id);
    setReason('');
    setError(null);
  };

  const cancel = () => {
    setActingId(null);
    setError(null);
  };

  const submit = async () => {
    if (!actingId) return;
    if (copy.reasonRequired && !reason.trim()) {
      setError('A reason is required when revoking approval.');
      return;
    }

    const token = session?.accessToken;
    if (!token) {
      setError('Your session has expired. Please sign out and sign in again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/organizers/${actingId}/${copy.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });

      if (!res.ok) {
        let msg = `Server returned ${res.status}.`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch { /* ignore parse errors */ }
        if (res.status === 403) {
          msg = 'Access denied — your session may predate the Admin role. Sign out and sign in again.';
        }
        setError(msg);
        return;
      }

      const name = organizers.find((o) => o.id === actingId)?.businessName ?? 'Organizer';
      setOrganizers((prev) => prev.filter((o) => o.id !== actingId));
      cancel();
      setSuccessMsg(copy.success(name));
      setTimeout(() => setSuccessMsg(null), 6000);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : 'Unexpected error. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const ActionIcon = mode === 'revoke' ? ShieldOff : ShieldCheck;
  const actionButtonClass = mode === 'revoke'
    ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
    : 'border-green-600/40 text-green-700 hover:bg-green-50';
  const panelClass = mode === 'revoke'
    ? 'border-destructive/30 bg-destructive/5'
    : 'border-green-200 bg-green-50/60';
  const confirmClass = mode === 'revoke'
    ? 'bg-destructive text-white hover:bg-destructive/90'
    : 'bg-green-600 text-white hover:bg-green-700';

  return (
    <div className="mt-3 space-y-3">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {organizers.length > MAX_SHOWN && (
        <div className="space-y-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by business, contact name or email"
            aria-label={copy.searchLabel}
          />
          <p className="text-xs text-muted-foreground">
            {matches.length > MAX_SHOWN
              ? `Showing ${MAX_SHOWN} of ${matches.length} — search to narrow the list.`
              : `${matches.length} match${matches.length === 1 ? '' : 'es'}.`}
          </p>
        </div>
      )}

      {organizers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizers match “{query.trim()}”.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <Card key={o.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-base font-semibold">{o.businessName}</h3>
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {o.contactName}
                      </span>
                      <span className="flex items-center gap-1.5 break-all">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {o.contactEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {o.contactPhone}
                      </span>
                    </div>
                    {mode === 'reinstate' && (o.verificationNotes || o.verifiedAt) && (
                      <p className="text-sm">
                        <span className="font-medium">
                          Rejected{o.verifiedAt ? ` ${fmtDate(o.verifiedAt)}` : ''}
                          {o.verificationNotes ? ':' : ''}
                        </span>{' '}
                        {o.verificationNotes}
                      </p>
                    )}
                  </div>

                  {actingId !== o.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`shrink-0 ${actionButtonClass}`}
                      onClick={() => open(o.id)}
                    >
                      <ActionIcon className="mr-1 h-3.5 w-3.5" />
                      {copy.button}
                    </Button>
                  )}
                </div>

                {actingId === o.id && (
                  <>
                    <Separator className="my-4" />
                    <div className={`space-y-3 rounded-lg border p-4 ${panelClass}`}>
                      <p className="text-sm font-medium">{copy.question(o.businessName)}</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {copy.consequences.map((c) => <li key={c}>{c}</li>)}
                      </ul>

                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={copy.placeholder}
                        rows={2}
                        className="resize-none text-sm"
                      />

                      {error && (
                        <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" onClick={submit} disabled={loading} className={confirmClass}>
                          {loading ? (
                            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing…</>
                          ) : (
                            copy.confirm
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancel} disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
