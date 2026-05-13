import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Strategy:
 *   - Credentials provider authorizes by calling the C# API's /auth/login.
 *   - The API returns { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user }.
 *   - We persist all of that on the encrypted session JWT cookie.
 *   - The `jwt` callback transparently refreshes the access token via /auth/refresh
 *     when it's within 30s of expiry, and signs the user out if refresh fails.
 *
 * Server-side calls to the C# API attach `session.accessToken` as the bearer
 * token. The frontend never sees the refresh token; it lives only inside the
 * httpOnly Auth.js cookie.
 */

// ---- Module augmentation ----------------------------------------------------

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    accessTokenExpiresAt: number; // ms epoch
    error?: 'RefreshAccessTokenError';
    user: {
      id: string;
      email: string;
      fullName: string;
      roles: string[];
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userId: string;
    email: string;
    fullName: string;
    roles: string[];
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
    error?: 'RefreshAccessTokenError';
  }
}

// ---- Helpers ----------------------------------------------------------------

const API_BASE = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5080';

const ApiTokenResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    fullName: z.string(),
    phoneE164: z.string().nullable().optional(),
    isEmailVerified: z.boolean(),
    isPhoneVerified: z.boolean(),
    roles: z.array(z.string()),
  }),
});

type ApiTokenResponse = z.infer<typeof ApiTokenResponseSchema>;

async function refreshAccessToken(refreshToken: string): Promise<ApiTokenResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return ApiTokenResponseSchema.parse(await res.json());
  } catch {
    return null;
  }
}

// ---- NextAuth config --------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(creds);
        if (!parsed.success) return null;

        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
          cache: 'no-store',
        });
        if (!res.ok) return null;

        const tokens = ApiTokenResponseSchema.safeParse(await res.json());
        if (!tokens.success) return null;

        // What we return here is passed to the `jwt` callback as `user` on first sign-in.
        return {
          id: tokens.data.user.id,
          email: tokens.data.user.email,
          name: tokens.data.user.fullName,
          // Stash tokens on the user object so the jwt callback can hoist them.
          // They're not sent to the client — the jwt callback unpacks them.
          tokens: tokens.data,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // First sign-in: copy from the credentials response onto the JWT.
      if (user && (user as { tokens?: ApiTokenResponse }).tokens) {
        const t = (user as { tokens: ApiTokenResponse }).tokens;
        token.userId = t.user.id;
        token.email = t.user.email;
        token.fullName = t.user.fullName;
        token.roles = t.user.roles;
        token.accessToken = t.accessToken;
        token.accessTokenExpiresAt = Date.parse(t.accessTokenExpiresAt);
        token.refreshToken = t.refreshToken;
        token.refreshTokenExpiresAt = Date.parse(t.refreshTokenExpiresAt);
        return token;
      }

      // Manual session.update() can patch the JWT.
      if (trigger === 'update' && session) return { ...token, ...session };

      // Subsequent requests: refresh if the access token is within 30s of expiry.
      const now = Date.now();
      if (token.accessTokenExpiresAt && now < token.accessTokenExpiresAt - 30_000) {
        return token;
      }

      const refreshed = await refreshAccessToken(token.refreshToken);
      if (!refreshed) {
        token.error = 'RefreshAccessTokenError';
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.accessTokenExpiresAt = Date.parse(refreshed.accessTokenExpiresAt);
      token.refreshToken = refreshed.refreshToken;
      token.refreshTokenExpiresAt = Date.parse(refreshed.refreshTokenExpiresAt);
      token.roles = refreshed.user.roles;
      delete token.error;
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      session.error = token.error;
      session.user = {
        ...session.user,
        id: token.userId,
        email: token.email,
        fullName: token.fullName,
        roles: token.roles,
      };
      return session;
    },
  },
});
