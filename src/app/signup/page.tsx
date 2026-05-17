import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Create account · TicketSales' };

const PERKS = [
  'Browse and book events instantly',
  'QR tickets on your phone — no printing needed',
  'Transfer tickets to friends with one tap',
  'Become a verified event organizer',
];

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[42%] gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col justify-between p-10 xl:p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Ticket className="h-4 w-4" />
            </div>
            TicketSales
          </Link>

          <div>
            <h2 className="font-display text-3xl font-bold leading-tight xl:text-4xl">
              Everything you need<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, hsl(44 96% 65%), hsl(44 96% 82%))' }}
              >
                for live events
              </span>
            </h2>
            <p className="mt-4 text-sm text-white/65 leading-relaxed max-w-xs">
              Join thousands of Jamaicans discovering and attending events every week.
            </p>

            <ul className="mt-8 space-y-3.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  {perk}
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

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-5">
              <CardTitle className="font-display text-2xl font-bold tracking-tight">
                Create your account
              </CardTitle>
              <CardDescription>Free to join — takes less than a minute</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <SignupForm />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
