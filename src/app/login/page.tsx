import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Zap, ShieldCheck, Smartphone } from 'lucide-react';

export const metadata = { title: 'Sign in · TicketSales' };

const FEATURES = [
  { icon: Zap, title: 'Instant tickets', desc: 'QR codes delivered immediately after payment.' },
  { icon: ShieldCheck, title: 'Secure checkout', desc: 'Payments processed by Stripe — we never see your card.' },
  { icon: Smartphone, title: 'Works anywhere', desc: 'Mobile-first design for buyers and gate scanners alike.' },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[42%] gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-primary/30 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col justify-between p-10 xl:p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Ticket className="h-4 w-4" />
            </div>
            TicketSales
          </Link>

          {/* Main copy */}
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight xl:text-4xl">
              Your gateway to<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, hsl(44 96% 65%), hsl(44 96% 82%))' }}
              >
                Jamaica&apos;s best events
              </span>
            </h2>
            <p className="mt-4 text-sm text-white/65 leading-relaxed max-w-xs">
              Concerts, dancehall parties, stage shows, and beach festivals — all in one place.
            </p>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <f.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-white/55 mt-0.5">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/35">© {new Date().getFullYear()} TicketSales · Made in Jamaica 🇯🇲</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Ticket className="h-3.5 w-3.5 text-white" />
              </div>
              TicketSales
            </Link>
          </div>

          <Card>
            <CardHeader className="pb-5">
              <CardTitle className="font-display text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>Sign in to access your tickets and account</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-2">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
