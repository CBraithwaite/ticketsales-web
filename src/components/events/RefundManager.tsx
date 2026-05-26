'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import type { OrganizerRefundSummary } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  eventId: string;
  refunds: OrganizerRefundSummary[];
}

const STATUS_BADGE: Record<string, string> = {
  Requested: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Processing: 'bg-blue-100 text-blue-800',
  Refunded: 'bg-green-100 text-green-800',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-JM', {
    timeZone: 'America/Jamaica',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-JM', { minimumFractionDigits: 2 })}`;
}

export default function RefundManager({ eventId, refunds: initial }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [refunds, setRefunds] = useState(initial);
  const [expanded, setExpanded] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pending_count = refunds.filter((r) => r.status === 'Requested').length;

  const decide = async (refundId: string, approve: boolean, reason?: string) => {
    if (!session?.accessToken) return;
    setPending(refundId);
    setError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/events/${eventId}/refunds/${refundId}/decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ approve, reason: reason ?? null }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `Failed (${res.status})`);
        return;
      }
      const updated = await res.json();
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === refundId
            ? { ...r, status: updated.status, resolvedAt: updated.resolvedAt }
            : r,
        ),
      );
      setRejectId(null);
      setRejectReason('');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setPending(null);
    }
  };

  if (refunds.length === 0) return null;

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Refund Requests</h3>
          {pending_count > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              {pending_count} pending
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {refunds.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium">#{r.orderNumber}</span>
                    <span className="text-sm text-muted-foreground">{r.buyerName}</span>
                    <Badge className={`text-xs ${STATUS_BADGE[r.status] ?? ''}`}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{fmtMoney(r.amount, r.currency)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Requested {fmtDate(r.requestedAt)}
                    {r.resolvedAt && ` · Resolved ${fmtDate(r.resolvedAt)}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground italic">"{r.reason}"</p>
                </div>

                {r.status === 'Requested' && (
                  <div className="flex shrink-0 gap-2">
                    {rejectId !== r.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5"
                        disabled={pending === r.id}
                        onClick={() => { setRejectId(r.id); setRejectReason(''); setError(null); }}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={pending === r.id}
                      onClick={() => decide(r.id, true)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {pending === r.id ? 'Approving…' : 'Approve'}
                    </Button>
                  </div>
                )}
              </div>

              {rejectId === r.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Optional reason for rejection…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending === r.id}
                      onClick={() => decide(r.id, false, rejectReason)}
                    >
                      {pending === r.id ? 'Rejecting…' : 'Confirm Reject'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setRejectId(null); setRejectReason(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {refunds.every((r) => r.status !== 'Requested') && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> No pending refund requests.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
