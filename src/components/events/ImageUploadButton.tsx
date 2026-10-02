'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES, eventImagePath } from '@/lib/image-upload';

interface Props {
  /** Called with the public URL of each uploaded image. */
  onUploaded: (url: string) => void;
  label?: string;
  multiple?: boolean;
}

/**
 * Uploads event images straight from the browser to Vercel Blob. /api/upload
 * only hands out a short-lived token (organizers/admins, images ≤ 8 MB).
 */
export default function ImageUploadButton({ onUploaded, label = 'Upload image', multiple = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      if (!IMAGE_CONTENT_TYPES.includes(file.type)) {
        setError(`${file.name}: use a JPEG, PNG, WebP, GIF or AVIF image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`${file.name} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
        continue;
      }
      try {
        setProgress(0);
        const blob = await upload(eventImagePath(file.name), file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: file.type,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        onUploaded(blob.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        setProgress(null);
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const busy = progress !== null;

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_CONTENT_TYPES.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
        {busy ? `Uploading… ${progress}%` : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
