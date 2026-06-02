import Link from 'next/link';

const LINKS = {
  Discover: [
    { label: 'Browse Events', href: '/' },
    { label: 'Jamaica', href: '/?country=Jamaica' },
    { label: 'Trinidad & Tobago', href: '/?country=TrinidadAndTobago' },
    { label: 'Barbados', href: '/?country=Barbados' },
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
            <Link href="/" className="inline-flex items-center" aria-label="Choice Stubs — home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/choicestubs-logo.svg" alt="Choice Stubs" className="h-10 w-auto" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              Your home for live events — discover, sell, and scan tickets anywhere.
            </p>
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
            © {new Date().getFullYear()} Choice Stubs Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            GCT (15%) applied where applicable · Prices in JMD unless stated
          </p>
        </div>
      </div>
    </footer>
  );
}
