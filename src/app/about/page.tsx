import type { Metadata } from 'next';
import Link from 'next/link';
import { Ticket, ScanLine, Wallet, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleHero } from '@/components/help/Article';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Choice Stubs is the Caribbean-built ticketing platform for live events — discover, sell, and scan tickets anywhere.',
};

const PILLARS = [
  {
    icon: Ticket,
    title: 'Built for the Caribbean',
    body: 'From Kingston dancehall to Montego Bay festivals — local categories, local currency, and checkout that works on any phone.',
  },
  {
    icon: ScanLine,
    title: 'Gates that never stall',
    body: 'Our scanner validates QR tickets fully offline and syncs when signal returns, because venue Wi-Fi should never hold up your line.',
  },
  {
    icon: Wallet,
    title: 'Transparent money',
    body: 'One service fee, always itemized before payment. Organizers get clear statements and payouts to local banks after every event.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust on both sides',
    body: 'Organizers are identity-verified before selling paid tickets, and every ticket is a signed, single-use QR code that can’t be copied.',
  },
];

export default function AboutPage() {
  return (
    <>
      <ArticleHero
        eyebrow="About Choice Stubs"
        title="Live events deserve better ticketing"
        description="Choice Stubs helps Caribbean promoters sell out their events and helps fans get in fast — with secure payments, instant QR tickets, and gate scanning that works even without signal."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border/60 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold tracking-tight mb-1">{p.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl gradient-hero p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-50" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Join the movement
            </h2>
            <p className="mt-3 text-white/70 max-w-md mx-auto text-sm sm:text-base">
              Whether you&apos;re throwing your first party or running a festival, Choice
              Stubs gives you the tools the big platforms keep for themselves.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold border-0"
                asChild
              >
                <Link href="/organizer/apply">Sell Tickets</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-sm border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/">Browse Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
