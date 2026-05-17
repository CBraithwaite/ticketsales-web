'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Wallet, ArrowDownToLine, Clock, CheckCircle2, Loader2,
  Building2, ChevronRight, CalendarDays,
} from 'lucide-react';
import type { PayoutEventSummary, PayoutResponse, OrganizerResponse } from '@/types/api';
import { getApiBaseUrl } from '@/lib/api';

const fmt = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString('en-JM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-JM', { month: 'short', day: 'numeric', year: 'numeric' });

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Processing: 'bg-blue-100 text-blue-800',
    Paid: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export default function OrganizerPayoutsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [organizer, setOrganizer] = useState<OrganizerResponse | null>(null);
  const [summaries, setSummaries] = useState<PayoutEventSummary[]>([]);
  const [payouts, setPayouts] = useState<PayoutResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bank details dialog
  const [bankDialog, setBankDialog] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Request payout dialog
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<PayoutEventSummary | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const token = (session as { accessToken?: string } | null)?.accessToken;

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${getApiBaseUrl()}/api/v1/organizers/me`, { headers: headers() }),
      fetch(`${getApiBaseUrl()}/api/v1/organizers/me/payouts/summary`, { headers: headers() }),
      fetch(`${getApiBaseUrl()}/api/v1/organizers/me/payouts`, { headers: headers() }),
    ])
      .then(async ([orgRes, summRes, payRes]) => {
        if (!orgRes.ok) throw new Error('Could not load organizer profile.');
        const org = await orgRes.json() as OrganizerResponse;
        const summ = summRes.ok ? await summRes.json() as PayoutEventSummary[] : [];
        const pays = payRes.ok ? await payRes.json() as PayoutResponse[] : [];
        setOrganizer(org);
        setBankName(org.payoutBankName ?? '');
        setSummaries(summ);
        setPayouts(pays);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const saveBankDetails = async () => {
    setBankSaving(true);
    setBankError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/organizers/me/bank-details`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ bankName, accountNumber }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed to save.');
      }
      const updated = await res.json() as { bankName: string; accountLast4: string };
      setOrganizer((prev) => prev
        ? { ...prev, payoutBankName: updated.bankName, payoutBankAccountLast4: updated.accountLast4 }
        : prev);
      setBankDialog(false);
    } catch (e: unknown) {
      setBankError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setBankSaving(false);
    }
  };

  const requestPayout = async () => {
    if (!selectedSummary) return;
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const now = new Date().toISOString();
      const res = await fetch(`${getApiBaseUrl()}/api/v1/organizers/me/payouts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          eventId: selectedSummary.eventId,
          periodStart: '2000-01-01T00:00:00Z',
          periodEnd: now,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed to request payout.');
      }
      const newPayout = await res.json() as PayoutResponse;
      setPayouts((prev) => [newPayout, ...prev]);
      setSummaries((prev) =>
        prev.map((s) =>
          s.eventId === selectedSummary.eventId
            ? { ...s, pendingPayoutAmount: s.pendingPayoutAmount + newPayout.netAmount, eligibleAmount: 0 }
            : s,
        ),
      );
      setPayoutDialog(false);
      setSelectedSummary(null);
    } catch (e: unknown) {
      setPayoutError(e instanceof Error ? e.message : 'Failed.');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => router.push('/organizer')}>Back to Dashboard</Button>
      </div>
    );
  }

  const totalEarned = summaries.reduce((a, s) => a + s.grossAmount, 0);
  const totalEligible = summaries.reduce((a, s) => a + s.eligibleAmount, 0);
  const totalPaidOut = summaries.reduce((a, s) => a + s.paidOutAmount, 0);
  const primaryCurrency = summaries[0]?.currency ?? 'JMD';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            72-hour hold on new sales · payouts by bank transfer
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setBankDialog(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          {organizer?.payoutBankName ? 'Bank details' : 'Add bank details'}
        </Button>
      </div>

      {/* Bank details banner */}
      {!organizer?.payoutBankName && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Add your bank details to receive payouts</p>
            <p className="text-xs text-amber-700 mt-0.5">Required before you can request a payout.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setBankDialog(true)}>Add now</Button>
        </div>
      )}

      {organizer?.payoutBankName && (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">{organizer.payoutBankName}</p>
            <p className="text-xs text-muted-foreground">Account ending ••••{organizer.payoutBankAccountLast4}</p>
          </div>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setBankDialog(true)}>
            Update
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total earned</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalEarned, primaryCurrency)}</p>
            <p className="text-xs text-muted-foreground mt-1">All-time gross sales</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Available to request</p>
            <p className="text-2xl font-bold mt-1 text-primary">{fmt(totalEligible, primaryCurrency)}</p>
            <p className="text-xs text-muted-foreground mt-1">Orders settled 72h+ ago</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid out</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalPaidOut, primaryCurrency)}</p>
            <p className="text-xs text-muted-foreground mt-1">Successfully transferred</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-event settlement */}
      {summaries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3">Event settlement</h2>
          <div className="space-y-3">
            {summaries.map((s) => (
              <Card key={s.eventId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.eventName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(s.eventDate)}
                        </span>
                        <span>{s.ticketsSold} tickets</span>
                      </div>
                    </div>
                    {s.eligibleAmount > 0 && organizer?.payoutBankName && (
                      <Button
                        size="sm"
                        onClick={() => { setSelectedSummary(s); setPayoutDialog(true); }}
                      >
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Request {fmt(s.eligibleAmount, s.currency)}
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <Stat label="Gross" value={fmt(s.grossAmount, s.currency)} />
                    <Stat label="Platform fees" value={`−${fmt(s.feesAmount, s.currency)}`} muted />
                    <Stat label="Your share" value={fmt(s.netAmount, s.currency)} bold />
                    <Stat
                      label={s.eligibleAmount > 0 ? 'Ready to pay out' : 'Pending hold'}
                      value={fmt(s.eligibleAmount > 0 ? s.eligibleAmount : (s.netAmount - s.paidOutAmount - s.pendingPayoutAmount), s.currency)}
                      highlight={s.eligibleAmount > 0}
                    />
                  </div>
                  {s.pendingPayoutAmount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {fmt(s.pendingPayoutAmount, s.currency)} payout in progress
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {summaries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No sales yet. Once your events have paid orders they&apos;ll appear here.</p>
        </div>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Payout history</h2>
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.eventName ?? 'Aggregate payout'}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                    {p.bankRef && <span className="ml-2 font-mono">Ref: {p.bankRef}</span>}
                  </p>
                </div>
                <p className="font-semibold text-sm whitespace-nowrap">{fmt(p.netAmount, p.currency)}</p>
                <Badge className={`text-xs ${statusBadge(p.status)}`}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank details dialog */}
      <Dialog open={bankDialog} onOpenChange={setBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout bank details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="bankName">Bank name</Label>
              <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)}
                placeholder="NCB, Scotia, JN, Sagicor…" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account number</Label>
              <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Full account number" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Only the last 4 digits are stored and displayed.</p>
            </div>
            {bankError && <p className="text-sm text-destructive">{bankError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialog(false)}>Cancel</Button>
            <Button onClick={saveBankDetails} disabled={bankSaving || !bankName || !accountNumber}>
              {bankSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request payout dialog */}
      <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request payout</DialogTitle>
          </DialogHeader>
          {selectedSummary && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                You&apos;re requesting a payout for <strong>{selectedSummary.eventName}</strong>.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{fmt(selectedSummary.eligibleAmount, selectedSummary.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To account</span>
                  <span>{organizer?.payoutBankName} ••••{organizer?.payoutBankAccountLast4}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Payouts are processed within 2–5 business days. You&apos;ll see the reference in your payout history.
              </p>
              {payoutError && <p className="text-sm text-destructive">{payoutError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(false)}>Cancel</Button>
            <Button onClick={requestPayout} disabled={payoutLoading}>
              {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Request payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, muted, bold, highlight }: {
  label: string; value: string; muted?: boolean; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm mt-0.5 ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''} ${highlight ? 'text-primary font-semibold' : ''}`}>
        {value}
      </p>
    </div>
  );
}
