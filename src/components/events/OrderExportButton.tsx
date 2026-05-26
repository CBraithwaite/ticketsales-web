'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  eventId: string;
  eventSlug: string;
}

export default function OrderExportButton({ eventId, eventSlug }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/events/${eventId}/orders/export`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );

      if (!res.ok) {
        setError(`Export failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${eventSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={download} disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Exporting…</>
          : <><Download className="h-4 w-4 mr-1.5" />Export CSV</>}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
