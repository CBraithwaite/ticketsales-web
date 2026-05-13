'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

export default function OrganizerVerificationQueue({ organizers: initial }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [organizers, setOrganizers] = useState(initial);
  const [actionOrgId, setActionOrgId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken}`,
  };

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

  const submit = () =>
    start(async () => {
      if (!actionOrgId || !actionType) return;
      setError(null);

      if (actionType === 'reject' && !reason.trim()) {
        setError('A reason is required when rejecting.');
        return;
      }

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/organizers/${actionOrgId}/${actionType}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: reason.trim() || null }),
        },
      );

      if (!res.ok) {
        try {
          const body = await res.json();
          setError(body?.error ?? `Server returned ${res.status}.`);
        } catch {
          setError(`Server returned ${res.status}.`);
        }
        return;
      }

      setOrganizers((prev) => prev.filter((o) => o.id !== actionOrgId));
      cancel();
      router.refresh();
    });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-JM', {
      timeZone: 'America/Jamaica',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <ul className="mt-3 space-y-3">
      {organizers.map((o) => (
        <Card key={o.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{o.businessName}</h3>
                <p className="text-sm text-neutral-600">
                  {o.contactName} · {o.contactEmail} · {o.contactPhone}
                </p>
                {o.taxRegistrationNumber && (
                  <p className="text-xs text-neutral-500">TRN: {o.taxRegistrationNumber}</p>
                )}
                <p className="mt-1 text-xs text-neutral-400">Applied {fmtDate(o.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openAction(o.id, 'approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => openAction(o.id, 'reject')}
                >
                  Reject
                </Button>
              </div>
            </div>

            {actionOrgId === o.id && (
              <>
                <Separator className="my-3" />
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-sm font-semibold">
                    {actionType === 'approve' ? 'Approve' : 'Reject'} {o.businessName}?
                  </p>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      actionType === 'reject'
                        ? 'Reason for rejection (required)'
                        : 'Optional note'
                    }
                    rows={2}
                    className="mt-2"
                  />
                  {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={submit}
                      disabled={pending}
                      className={
                        actionType === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }
                      variant={actionType === 'reject' ? 'destructive' : 'default'}
                    >
                      {pending
                        ? 'Processing…'
                        : actionType === 'approve'
                          ? 'Confirm approval'
                          : 'Confirm rejection'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancel}
                      disabled={pending}
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
  );
}
