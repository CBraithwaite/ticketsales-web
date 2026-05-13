import { auth } from '@/auth';
import { getApiBaseUrl } from './api';

/**
 * Server-side fetch wrapper that attaches the session's access token.
 * Use from Server Components and route handlers (NEVER from Client Components).
 *
 * If the session contains a refresh error, treat the user as signed-out and
 * fail fast with a 401 — the middleware will redirect them on the next request.
 */
export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await auth();
  if (!session || session.error === 'RefreshAccessTokenError') {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');

  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`;
  return fetch(url, { ...init, headers, cache: 'no-store' });
}
