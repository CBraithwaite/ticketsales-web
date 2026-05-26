'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';

interface Props {
  eventId: string;
  coverImageUrl: string | null;
  galleryUrls: string[];
}

export default function EventImageManager({ eventId, coverImageUrl: initialCover, galleryUrls: initialGallery }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [cover, setCover] = useState(initialCover ?? '');
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          coverImageUrl: cover || null,
          galleryUrls: gallery,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `Failed (${res.status})`);
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addGalleryUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed || gallery.includes(trimmed)) return;
    setGallery((prev) => [...prev, trimmed]);
    setNewUrl('');
  };

  const removeGalleryUrl = (url: string) => {
    setGallery((prev) => prev.filter((u) => u !== url));
  };

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">Event Images</h3>
          {initialCover && (
            <span className="text-xs text-muted-foreground">(cover set)</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-5">
          {/* Cover image */}
          <div className="space-y-2">
            <Label>Cover Image URL</Label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
            {cover && (
              <div className="relative overflow-hidden rounded-lg border aspect-video max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="space-y-3">
            <Label>Gallery Images</Label>
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.map((url) => (
                  <div key={url} className="group relative overflow-hidden rounded-lg border aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryUrl(url)}
                      className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/gallery.jpg"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryUrl())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addGalleryUrl}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-700">Images saved.</p>}

          <Button onClick={save} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving…' : 'Save Images'}
          </Button>
        </div>
      )}
    </div>
  );
}
