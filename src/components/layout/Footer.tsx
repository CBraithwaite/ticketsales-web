import Link from 'next/link';
import { Ticket } from 'lucide-react';

const LINKS = {
  Discover: [
    { label: 'Browse Events', href: '/' },
    { label: 'Kingston', href: '/?parish=Kingston' },
    { label: 'Montego Bay', href: '/?parish=StJames' },
    { label: 'Negril', href: '/?parish=Westmoreland' },
  ],
  Organizers: [
    { label: 'Sell Tickets', href: '/organizer/apply' },
    { label: 'Organizer Dashboard', href: '/organizer' },
    { label: 'Pricing & Fees', href: '#' },
    { label: 'Help Centre', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Contact', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6">

        {/* Top row */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 font-display font-bold text-base tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-sm">
                <Ticket className="h-4 w-4 text-white" />
              </div>
              Ticket<span className="text-primary">Sales</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              Jamaica&apos;s home for live events — from Kingston dancehall to Negril beach festivals.
            </p>
            <p className="mt-4 text-xs font-medium text-muted-foreground">🇯🇲 Made in Jamaica</p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider + bottom row */}
        <div className="mt-10 border-t border-border/60 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TicketSales Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            GCT (15%) applied where applicable · Prices in JMD unless stated
          </p>
        </div>
      </div>
    </footer>
  );
}
