/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Dockerfile (`output: 'standalone'` produces
  // a self-contained server bundle that the runtime stage copies in).
  output: 'standalone',
  // Public env vars must be prefixed with NEXT_PUBLIC_ to reach the browser.
  // Server-only env vars are read directly from process.env in server components.
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
