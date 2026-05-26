/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5080';

// script-src needs 'unsafe-eval' in dev for Next.js HMR; strip it in production.
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",          // https: covers organizer-hosted gallery images
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl} https: wss:`,   // https:/wss: covers NextAuth callbacks + prod API
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  // Prevent the page from being embedded in an iframe anywhere.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent browsers from MIME-sniffing away from the declared content-type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send only the origin (no path/query) as Referer on cross-origin navigations.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down sensor / peripheral APIs the app doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    typedRoutes: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
