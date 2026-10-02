/** Limits for event image uploads — enforced in the browser and again in the Blob token. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Blob pathname for an event image: events/<safe-name>.<ext> (Blob adds a random suffix). */
export function eventImagePath(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  return `events/${base}${ext ? `.${ext}` : ''}`;
}
