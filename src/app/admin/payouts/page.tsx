'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, Loader2, Building2, Clock, AlertCircle,
} from 'lucide-react';
import type { AdminPayoutItem, AdminBankTransferOrderItem } from '@/types/api';
import { getApiBaseUrl } from '@/lib/api';

const fmt = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString('en-JM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-JM', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function AdminPayoutsPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([]);
  const [bankOrders, setBankOrders] = useState<AdminBankTransferOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mark paid dialog
  const [markDialog, setMarkDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutItem | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  // Confirm bank payment dialog
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminBankTransferOrderItem | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`${getApiBaseUrl()}/api/v1/admin/payouts`, { headers: headers() }),
      fetch(`${getApiBaseUrl()}/api/v1/admin/orders/bank-transfer/pending`, { headers: headers() }),
    ])
      .then(async ([payRes, ordRes]) => {
        const pays = payRes.ok ? await payRes.json() as AdminPayoutItem[] : [];
        const ords = ordRes.ok ? await ordRes.json() as AdminBankTransferOrderItem[] : [];
        setPayouts(pays);
        setBankOrders(ords);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadData, [token]);

  const markPaid = async () => {
    if (!selectedPayout || !bankRef.trim()) return;
    setMarking(true);
    setMarkError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/payouts/${selectedPayout.id}/pay`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ bankRef: bankRef.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed.');
      }
      setPayouts((prev) => prev.filter((p) => p.id !== selectedPayout.id));
      setMarkDialog(false);
      setBankRef('');
      setSelectedPayout(null);
    } catch (e: unknown) {
      setMarkError(e instanceof Error ? e.message : 'Failed.');
    } finally {
      setMarking(false);
    }
  };

  const confirmBankPayment = async () => {
    if (!selectedOrder) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/orders/${selectedOrder.orderNumber}/confirm-bank-payment`,
        {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ notes: confirmNotes.trim() || null }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Failed.');
      }
      setBankOrders((prev) => prev.filter((o) => o.orderNumber !== selectedOrder.orderNumber));
      setConfirmDialog(false);
      setConfirmNotes('');
      setSelectedOrder(null);
    } catch (e: unknown) {
      setConfirmError(e instanceof Error ? e.message : 'Failed.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Payouts & Bank Transfers</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <Tabs defaultValue="payouts">
        <TabsList className="mb-6">
          <TabsTrigger value="payouts">
            Payout requests
            {payouts.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0">
                {payouts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bank-transfers">
            Bank transfers
            {bankOrders.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0">
                {bankOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---- Payout requests ---- */}
        <TabsContent value="payouts">
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No pending payout requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm">{p.organizerName}</p>
                        </div>
                        {p.eventName && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-6">{p.eventName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Requested {fmtDate(p.scheduledAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-semibold">{fmt(p.netAmount, p.currency)}</p>
                        <Button
                          size="sm"
                          onClick={() => { setSelectedPayout(p); setMarkDialog(true); }}
                        >
                          Mark paid
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Bank transfer orders ---- */}
        <TabsContent value="bank-transfers">
          {bankOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No pending bank transfer orders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bankOrders.map((o) => (
                <Card key={o.orderNumber}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{o.buyerName}</p>
                        <p className="text-xs text-muted-foreground">{o.buyerEmail}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{o.eventName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{o.orderNumber}</span>
                          {o.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires {fmtDate(o.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-semibold">{fmt(o.totalAmount, o.currency)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedOrder(o); setConfirmDialog(true); }}
                        >
                          Confirm payment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mark payout paid dialog */}
      <Dialog open={markDialog} onOpenChange={setMarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark payout as paid</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organizer</span>
                  <span>{selectedPayout.organizerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{fmt(selectedPayout.netAmount, selectedPayout.currency)}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="bankRef">Bank reference / transfer ID</Label>
                <Input
                  id="bankRef"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="e.g. NCB-TXN-20260517-001"
                  className="mt-1"
                />
              </div>
              {markError && <p className="text-sm text-destructive">{markError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkDialog(false)}>Cancel</Button>
            <Button onClick={markPaid} disabled={marking || !bankRef.trim()}>
              {marking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark as paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm bank payment dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm bank transfer received</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Confirming this will issue tickets for order{' '}
                <span className="font-mono font-medium">{selectedOrder.orderNumber}</span> to{' '}
                <strong>{selectedOrder.buyerName}</strong>.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event</span>
                  <span>{selectedOrder.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount received</span>
                  <span className="font-semibold">{fmt(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmNotes">Notes (optional)</Label>
                <Input
                  id="confirmNotes"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Bank reference, confirmation number…"
                  className="mt-1"
                />
              </div>
              {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button onClick={confirmBankPayment} disabled={confirming}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & issue tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
