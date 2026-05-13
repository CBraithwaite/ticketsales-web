# TicketSales Web (Frontend)

Next.js 14 (App Router) + TypeScript + Tailwind CSS. Server-rendered by default;
interactive flows opt in to Client Components as needed.

Phase 1 wires up Auth.js v5 (NextAuth) with the C# API as the credentials
backend, including transparent refresh-token rotation.

## Prerequisites

- Node.js 20+ (22 LTS recommended)
- npm 10+
- Backend API running (see `../backend/README.md`)

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local
node -e "require('fs').appendFileSync('.env.local', 'AUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64') + '\n')"
npm run dev
```

The site runs at http://localhost:3000.

## Pages (Phase 1)

| Path        | Access     | What it shows                                     |
| ----------- | ---------- | ------------------------------------------------- |
| `/`         | public     | Landing + API ping + sign-in / sign-up CTAs       |
| `/login`    | guest only | Email + password sign-in                          |
| `/signup`   | guest only | Create a new account                              |
| `/me`       | authed     | Current user profile fetched from `/api/v1/me`    |

`/me` is protected by middleware (`src/middleware.ts`); signed-out visits
redirect to `/login?next=/me` and bounce back after sign-in.

## Auth flow

1. User submits the login form. NextAuth's `signIn('credentials', ...)`
   triggers `auth.ts`'s Credentials provider, which calls the C# API
   `POST /api/v1/auth/login`.
2. The API returns access + refresh tokens. NextAuth stores both encrypted
   inside the session JWT cookie (httpOnly).
3. On every request, the `jwt` callback checks if the access token is within
   30 seconds of expiry. If so, it calls `POST /api/v1/auth/refresh`, rotates
   tokens, and updates the cookie. If refresh fails, it sets
   `session.error = 'RefreshAccessTokenError'` so the UI can prompt re-auth.
4. Server Components call the API via `authedFetch()` (`lib/server-fetch.ts`),
   which attaches `Authorization: Bearer <accessToken>` automatically.

The browser never sees the refresh token.

## Project layout

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts   # Auth.js handler
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── me/page.tsx                       # Protected (server component)
│   │   ├── layout.tsx                        # Wraps Providers
│   │   ├── page.tsx                          # Landing
│   │   └── globals.css
│   ├── auth.ts                               # NextAuth config
│   ├── middleware.ts                         # Route protection
│   ├── components/
│   │   ├── Providers.tsx                     # SessionProvider
│   │   └── auth/{LoginForm,SignupForm,SignOutButton}.tsx
│   └── lib/{api.ts, server-fetch.ts}
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── Dockerfile
```

## Environment variables

| Var                       | Scope     | Notes                                              |
| ------------------------- | --------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`| Browser   | Public API URL — must be reachable from end-users  |
| `API_INTERNAL_BASE_URL`   | Server    | Used inside Server Components; can be private URL  |
| `AUTH_SECRET`             | Server    | Session signing key (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)    |
| `AUTH_URL`                | Server    | Canonical site URL                                 |
| `AUTH_TRUST_HOST`         | Server    | `true` in dev / behind trusted proxies             |
