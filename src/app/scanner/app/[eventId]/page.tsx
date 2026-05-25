'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  type ManifestTicket,
  type PendingScan,
  type ScanHistoryEntry,
  saveManifest,
  getManifest,
  addPendingScan,
  getPendingScans,
  clearPendingScans,
  addScanHistory,
  getRecentScans,
  markTicketRedeemed,
} from '@/lib/scanner-db';
import QrScanner from '@/components/scanner/QrScanner';
import ScanResult, { type ScanResultData } from '@/components/scanner/ScanResult';

interface ManifestResponse {
  eventId: string;
  eventName: string;
  gate: string | null;
  generatedAt: string;
  tickets: ManifestTicket[];
}

function generateDeviceId(): string {
  const stored = localStorage.getItem('scanner-device-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('scanner-device-id', id);
  return id;
}

export default function ScannerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [tickets, setTickets] = useState<ManifestTicket[]>([]);
  const [eventName, setEventName] = useState('');
  const [gate, setGate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ManifestTicket[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const deviceId = useRef('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?next=/scanner/app/${eventId}`);
    }
  }, [status, router, eventId]);

  // Initialize device ID
  useEffect(() => {
    deviceId.current = generateDeviceId();
  }, []);

  // Load manifest
  const fetchManifest = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/scanner/events/${eventId}/manifest`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have access to scan this event.');
        } else {
          setError(`Failed to load manifest (${res.status}).`);
        }
        // Try loading from cache
        const cached = await getManifest(eventId);
        if (cached.length > 0) {
          setTickets(cached);
          setError((prev) => prev + ' Using cached data.');
        }
        setLoading(false);
        return;
      }

      const data: ManifestResponse = await res.json();
      setEventName(data.eventName);
      setGate(data.gate);
      setTickets(data.tickets);
      setLastRefresh(new Date().toLocaleTimeString('en-JM', { timeZone: 'America/Jamaica' }));

      // Cache in IndexedDB
      await saveManifest(eventId, data.tickets);
    } catch {
      // Offline — try cache
      const cached = await getManifest(eventId);
      if (cached.length > 0) {
        setTickets(cached);
        setError('Offline — using cached ticket data.');
      } else {
        setError('Unable to connect. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, eventId]);

  useEffect(() => {
    if (session?.accessToken) fetchManifest();
  }, [session?.accessToken, fetchManifest]);

  // Load recent scans
  useEffect(() => {
    getRecentScans(20).then(setRecentScans).catch(() => {});
    getPendingScans().then((p) => setPendingCount(p.length)).catch(() => {});
  }, []);

  // Build QR → ticket lookup map
  const qrMap = useRef(new Map<string, ManifestTicket>());
  useEffect(() => {
    const m = new Map<string, ManifestTicket>();
    for (const t of tickets) {
      m.set(t.qrCode, t);
    }
    qrMap.current = m;
  }, [tickets]);

  // Handle QR scan
  const handleScan = useCallback(
    async (qrData: string) => {
      setScannerOpen(false);

      // Signed QR payloads are JSON: { t: "qrCodeUuidNoHyphens", e: "...", ... }
      // Normalize "N" format (no hyphens) to standard UUID format for map lookup.
      let lookupKey = qrData;
      try {
        const parsed = JSON.parse(qrData) as { t?: string };
        if (typeof parsed.t === 'string' && /^[0-9a-f]{32}$/i.test(parsed.t)) {
          const h = parsed.t.toLowerCase();
          lookupKey = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
        }
      } catch {
        // not JSON — use raw data as-is
      }

      const ticket = qrMap.current.get(lookupKey);

      if (!ticket) {
        setScanResult({ type: 'invalid', message: 'Ticket not found in manifest' });
        return;
      }

      if (ticket.status === 'Redeemed') {
        setScanResult({
          type: 'already_scanned',
          holderName: ticket.holderName,
          tierName: ticket.tierName,
          message: 'This ticket has already been scanned',
        });
        return;
      }

      if (ticket.status === 'Refunded' || ticket.status === 'Cancelled') {
        setScanResult({
          type: 'refunded',
          holderName: ticket.holderName,
          tierName: ticket.tierName,
          message: `Ticket is ${ticket.status.toLowerCase()}`,
        });
        return;
      }

      // Valid scan
      setScanResult({
        type: 'valid',
        holderName: ticket.holderName,
        tierName: ticket.tierName,
      });

      // Update local state
      ticket.status = 'Redeemed';
      setTickets((prev) => [...prev]);

      // Update IndexedDB
      await markTicketRedeemed(ticket.ticketId);

      const now = new Date().toISOString();
      const scanId = crypto.randomUUID();

      // Queue for batch sync
      const pending: PendingScan = {
        id: scanId,
        ticketId: ticket.ticketId,
        scannedAt: now,
        deviceId: deviceId.current,
        gate,
        result: 'valid',
        holderName: ticket.holderName,
        tierName: ticket.tierName,
      };
      await addPendingScan(pending);
      setPendingCount((c) => c + 1);

      // Add to history
      const historyEntry: ScanHistoryEntry = {
        id: scanId,
        ticketId: ticket.ticketId,
        holderName: ticket.holderName,
        tierName: ticket.tierName,
        result: 'valid',
        scannedAt: now,
      };
      await addScanHistory(historyEntry);
      setRecentScans((prev) => [historyEntry, ...prev].slice(0, 20));
    },
    [gate],
  );

  // Batch sync pending scans
  const syncPendingScans = useCallback(async () => {
    if (!session?.accessToken || syncing) return;
    setSyncing(true);

    try {
      const pending = await getPendingScans();
      if (pending.length === 0) {
        setSyncing(false);
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/v1/scanner/scan-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          scans: pending.map((s) => ({
            ticketId: s.ticketId,
            scannedAt: s.scannedAt,
            deviceId: s.deviceId,
            gate: s.gate,
          })),
        }),
      });

      if (res.ok) {
        await clearPendingScans(pending.map((s) => s.id));
        setPendingCount(0);
      }
    } catch {
      // Will retry on next sync
    } finally {
      setSyncing(false);
    }
  }, [session?.accessToken, syncing]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(syncPendingScans, 30_000);
    return () => clearInterval(interval);
  }, [syncPendingScans]);

  // Search tickets
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      const q = query.toLowerCase();
      const results = tickets.filter(
        (t) =>
          t.holderName.toLowerCase().includes(q) ||
          t.ticketId.toLowerCase().includes(q) ||
          t.qrCode.toLowerCase().includes(q),
      );
      setSearchResults(results.slice(0, 10));
    },
    [tickets],
  );

  // Manual admit from search
  const handleManualAdmit = useCallback(
    async (ticket: ManifestTicket) => {
      if (ticket.status === 'Redeemed') {
        setScanResult({
          type: 'already_scanned',
          holderName: ticket.holderName,
          tierName: ticket.tierName,
          message: 'This ticket has already been scanned',
        });
        return;
      }

      setScanResult({
        type: 'valid',
        holderName: ticket.holderName,
        tierName: ticket.tierName,
      });

      ticket.status = 'Redeemed';
      setTickets((prev) => [...prev]);
      await markTicketRedeemed(ticket.ticketId);

      const now = new Date().toISOString();
      const scanId = crypto.randomUUID();

      await addPendingScan({
        id: scanId,
        ticketId: ticket.ticketId,
        scannedAt: now,
        deviceId: deviceId.current,
        gate,
        result: 'valid',
        holderName: ticket.holderName,
        tierName: ticket.tierName,
      });
      setPendingCount((c) => c + 1);

      await addScanHistory({
        id: scanId,
        ticketId: ticket.ticketId,
        holderName: ticket.holderName,
        tierName: ticket.tierName,
        result: 'valid',
        scannedAt: now,
      });
      setRecentScans((prev) =>
        [
          {
            id: scanId,
            ticketId: ticket.ticketId,
            holderName: ticket.holderName,
            tierName: ticket.tierName,
            result: 'valid',
            scannedAt: now,
          },
          ...prev,
        ].slice(0, 20),
      );

      setSearchQuery('');
      setSearchResults(null);
    },
    [gate],
  );

  // Stats
  const totalTickets = tickets.length;
  const scannedCount = tickets.filter((t) => t.status === 'Redeemed').length;
  const remainingCount = tickets.filter((t) => t.status === 'Active').length;

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading scanner…</p>
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <main className="mx-auto max-w-lg px-4 pb-32 pt-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight">{eventName || 'Scanner'}</h1>
        {gate && (
          <p className="text-sm text-muted-foreground">
            Gate: <span className="font-semibold">{gate}</span>
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">Updated {lastRefresh}</span>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {pendingCount} pending sync
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totalTickets}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{scannedCount}</p>
            <p className="text-xs text-muted-foreground">Scanned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{remainingCount}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan button */}
      <Button
        className="mb-3 h-16 w-full text-lg font-semibold"
        size="lg"
        onClick={() => setScannerOpen(true)}
      >
        📷 Scan Ticket
      </Button>

      {/* Sell tickets (door cash + comp) */}
      <Button
        className="mb-4 h-12 w-full text-base font-semibold"
        size="lg"
        variant="secondary"
        onClick={() => router.push(`/scanner/app/${eventId}/sell`)}
      >
        💵 Sell Tickets at Door
      </Button>

      {/* Actions row */}
      <div className="mb-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={fetchManifest} disabled={loading}>
          ↻ Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={syncPendingScans}
          disabled={syncing || pendingCount === 0}
        >
          {syncing ? 'Syncing…' : `Sync (${pendingCount})`}
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Manual lookup */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Manual Lookup</p>
        <Input
          placeholder="Search by name or ticket ID…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-12 text-base"
        />
        {searchResults && (
          <div className="mt-2 space-y-2">
            {searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No tickets found.</p>
            )}
            {searchResults.map((t) => (
              <Card key={t.ticketId}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{t.holderName}</p>
                    <p className="text-xs text-muted-foreground">{t.tierName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={t.status === 'Active' ? 'default' : 'secondary'}
                      className={
                        t.status === 'Active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : t.status === 'Redeemed'
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                      }
                    >
                      {t.status}
                    </Badge>
                    {t.status === 'Active' && (
                      <Button size="sm" className="h-8" onClick={() => handleManualAdmit(t)}>
                        Admit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Recent scans */}
      <div>
        <p className="mb-2 text-sm font-medium">Recent Scans</p>
        {recentScans.length === 0 && (
          <p className="text-sm text-muted-foreground">No scans yet.</p>
        )}
        <div className="space-y-2">
          {recentScans.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{s.holderName}</p>
                  <p className="text-xs text-muted-foreground">{s.tierName}</p>
                </div>
                <div className="text-right">
                  <Badge
                    variant="secondary"
                    className={
                      s.result === 'valid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {s.result === 'valid' ? '✓' : '✕'}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(s.scannedAt).toLocaleTimeString('en-JM', {
                      timeZone: 'America/Jamaica',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* QR Scanner overlay */}
      {scannerOpen && (
        <QrScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Scan result overlay */}
      {scanResult && (
        <ScanResult result={scanResult} onDismiss={() => setScanResult(null)} />
      )}
    </main>
  );
}
