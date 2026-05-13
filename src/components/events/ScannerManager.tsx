'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ScannerInvite {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  gate: string | null;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
  acceptUrl: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

interface Props {
  eventId: string;
  scanners: ScannerInvite[];
}

const STATUS_VARIANT: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  Accepted: 'bg-green-100 text-green-800 hover:bg-green-100',
  Expired: 'bg-neutral-100 text-neutral-500 hover:bg-neutral-100',
  Revoked: 'bg-red-100 text-red-700 hover:bg-red-100',
};

export default function ScannerManager({ eventId, scanners: initial }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [scanners, setScanners] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gate, setGate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const invite = () =>
    start(async () => {
      setError(null);
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/events/${eventId}/scanners/invite`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || undefined,
            gate: gate.trim() || undefined,
          }),
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
      const created = (await res.json()) as ScannerInvite;
      setScanners((prev) => [created, ...prev]);
      setShowForm(false);
      setEmail('');
      setName('');
      setPhone('');
      setGate('');
      router.refresh();
    });

  const revoke = (inviteId: string) =>
    start(async () => {
      setError(null);
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/events/${eventId}/scanners/${inviteId}`,
        { method: 'DELETE', headers },
      );
      if (!res.ok) {
        setError(`Failed to revoke (status ${res.status}).`);
        return;
      }
      const updated = (await res.json()) as ScannerInvite;
      setScanners((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      router.refresh();
    });

  const copyLink = (acceptUrl: string, id: string) => {
    const fullUrl = `${window.location.origin}${acceptUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="mt-8">
      <Separator className="mb-6" />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Scanner staff ({scanners.filter((s) => s.status !== 'Revoked').length})
        </h2>
        {!showForm && (
          <Button
            type="button"
            size="sm"
            onClick={() => { setShowForm(true); setError(null); }}
          >
            + Invite scanner
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <h3 className="text-sm font-semibold">Invite scanner staff</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Brown"
                />
              </div>
              <div>
                <Label className="mb-1">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scanner@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+18761234567"
                />
              </div>
              <div>
                <Label className="mb-1">Gate (optional)</Label>
                <Input
                  value={gate}
                  onChange={(e) => setGate(e.target.value)}
                  placeholder="Gate A"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={invite}
              disabled={pending || !name.trim() || !email.trim()}
            >
              {pending ? 'Sending…' : 'Send invite'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Scanner list */}
      {scanners.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
          No scanner staff invited yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {scanners.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <Badge className={STATUS_VARIANT[s.status]}>
                    {s.status}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500">
                  {s.email}
                  {s.gate && <> · Gate: {s.gate}</>}
                </p>
                <p className="text-xs text-neutral-400">
                  {s.status === 'Accepted'
                    ? `Accepted ${new Date(s.acceptedAt!).toLocaleDateString('en-JM')}`
                    : s.status === 'Pending'
                      ? `Expires ${new Date(s.expiresAt).toLocaleDateString('en-JM')}`
                      : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {s.status === 'Pending' && s.acceptUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(s.acceptUrl!, s.id)}
                  >
                    {copiedId === s.id ? '✓ Copied' : 'Copy link'}
                  </Button>
                )}
                {(s.status === 'Pending' || s.status === 'Accepted') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Revoke scanner "${s.name}"?`)) revoke(s.id);
                    }}
                    disabled={pending}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
