'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Client-side providers shared by every page.
 * Currently just NextAuth's SessionProvider — added more here as the app grows.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
