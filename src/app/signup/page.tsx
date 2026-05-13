import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Create account · TicketSales' };

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Ticket className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Join TicketSales</h2>
          <p className="mt-3 text-lg text-white/80">
            Create your free account and start exploring events across Jamaica.
          </p>
          <ul className="mt-8 space-y-3">
            {['Browse and book events instantly', 'Secure mobile tickets', 'Become an event organizer'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
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
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Start discovering events across Jamaica</CardDescription>
            </CardHeader>
            <CardContent className="px-0 lg:px-6">
              <SignupForm />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
