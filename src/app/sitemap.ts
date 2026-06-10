import type { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@/lib/api';
import type { EventListItem } from '@/types/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://choicestubs.com';

const STATIC_PAGES: Array<{ path: string; priority: number }> = [
  { path: '', priority: 1 },
  { path: '/help', priority: 0.8 },
  { path: '/help/buyers', priority: 0.7 },
  { path: '/help/organizers', priority: 0.7 },
  { path: '/help/scanning', priority: 0.6 },
  { path: '/pricing', priority: 0.8 },
  { path: '/about', priority: 0.5 },
  { path: '/contact', priority: 0.5 },
  { path: '/terms', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
  { path: '/signup', priority: 0.6 },
  { path: '/login', priority: 0.4 },
  { path: '/organizer/apply', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    changeFrequency: p.path === '' ? 'daily' : 'weekly',
    priority: p.priority,
  }));

  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const events = (await res.json()) as EventListItem[];
      eventEntries = events
        .filter((e) => e.status === 'Published')
        .map((e) => ({
          url: `${SITE_URL}/events/${e.slug}`,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        }));
    }
  } catch {
    // API unreachable at build/revalidate time — ship the static pages only.
  }

  return [...staticEntries, ...eventEntries];
}
