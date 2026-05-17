'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Loader2, Building2, Mail, Phone, Hash, Clock } from 'lucide-react';

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

interface Props {
  organizers: AdminOrganizer[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-JM', {
    timeZone: 'America/Jamaica',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function OrganizerVerificationQueue({ organizers: initial }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [organizers, setOrganizers] = useState(initial);
  const [actionOrgId, setActionOrgId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openAction = (orgId: string, type: 'approve' | 'reject') => {
    setActionOrgId(orgId);
    setActionType(type);
    setReason('');
    setError(null);
  };

  const cancel = () => {
    setActionOrgId(null);
    setActionType(null);
    setError(null);
  };

  const submit = async () => {
    if (!actionOrgId || !actionType) return;

    if (actionType === 'reject' && !reason.trim()) {
      setError('A reason is required when rejecting.');
      return;
    }

    // Read the token at call-time, not at render-time, so we always get the
    // freshest value even if the access token was refreshed since mount.
    const token = session?.accessToken;
    if (!token) {
      setError('Your session has expired. Please sign out and sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/organizers/${actionOrgId}/${actionType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reason.trim() || null }),
        },
      );

      if (!res.ok) {
        let msg = `Server returned ${res.status}.`;
        try {
          const body = await res.json() as { error?: string };
          if (body?.error) msg = body.error;
        } catch { /* ignore parse errors */ }

        // 403 almost always means the session token predates the Admin role grant.
        if (res.status === 403) {
          msg = 'Access denied — your session may predate the Admin role. Sign out and sign in again.';
        }
        setError(msg);
        return;
      }

      const orgName = organizers.find(o => o.id === actionOrgId)?.businessName ?? 'Organizer';
      setOrganizers(prev => prev.filter(o => o.id !== actionOrgId));
      cancel();
      setSuccessMsg(
        actionType === 'approve'
          ? `${orgName} has been approved.`
          : `${orgName} has been rejected.`,
      );
      setTimeout(() => setSuccessMsg(null), 4000);
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

  return (
    <div className="mt-3 space-y-3">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <ul className="space-y-3">
        {organizers.map((o) => (
          <Card key={o.id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Details */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{o.businessName}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {o.verificationStatus}
                    </Badge>
                  </div>

                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {o.contactName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {o.contactEmail}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {o.contactPhone}
                    </span>
                    {o.taxRegistrationNumber && (
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 shrink-0" />
                        TRN: {o.taxRegistrationNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Applied {fmtDate(o.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {actionOrgId !== o.id && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openAction(o.id, 'approve')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => openAction(o.id, 'reject')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Confirmation panel */}
              {actionOrgId === o.id && (
                <>
                  <Separator className="my-4" />
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium">
                      {actionType === 'approve'
                        ? `Approve ${o.businessName}?`
                        : `Reject ${o.businessName}?`}
                    </p>

                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={
                        actionType === 'reject'
                          ? 'Reason for rejection (required)'
                          : 'Optional note for the organizer'
                      }
                      rows={2}
                      className="resize-none text-sm"
                    />

                    {error && (
                      <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={submit}
                        disabled={loading}
                        className={
                          actionType === 'approve'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-destructive hover:bg-destructive/90 text-white'
                        }
                      >
                        {loading ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing…</>
                        ) : actionType === 'approve' ? (
                          'Confirm Approval'
                        ) : (
                          'Confirm Rejection'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancel}
                        disabled={loading}
                      >
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
    </div>
  );
}
