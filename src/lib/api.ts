/**
 * Tiny typed API client used during Phase 0 to verify the frontend↔backend wiring.
 * Replaced by a generated TanStack-Query layer in Phase 1.
 */

/**
 * Resolve the base URL for API calls.
 *
 * - In Server Components, prefer `API_INTERNAL_BASE_URL` so traffic stays inside
 *   the private network (e.g., `http://api:8080` in docker-compose).
 * - In the browser, `NEXT_PUBLIC_API_BASE_URL` is the only URL available.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.API_INTERNAL_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      'http://localhost:5080'
    );
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5080';
}

export interface HelloResponse {
  message: string;
  environment: string;
  timestamp: string;
}

export async function fetchHello(): Promise<HelloResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/hello`, {
    // Don't cache the hello endpoint — we want a fresh ping every load.
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API responded with ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as HelloResponse;
}
