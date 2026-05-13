import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export const metadata = { title: 'Sign in · TicketSales' };

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Brand panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Ticket className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Welcome back to TicketSales</h2>
          <p className="mt-3 text-lg text-white/80">
            Your gateway to the best events across Jamaica. Sign in to manage your tickets and discover new experiences.
          </p>
          <div className="mt-8 flex gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Secure
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Fast
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Mobile-friendly
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Ticket className="h-5 w-5 text-primary" />
              TicketSales
            </div>
          </div>
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="px-0 lg:px-6">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="px-0 lg:px-6">
              <Suspense>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
