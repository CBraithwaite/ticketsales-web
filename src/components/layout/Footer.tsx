import { Ticket } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Ticket className="h-4 w-4 text-primary" />
            TicketSales
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} TicketSales. All rights reserved.</p>
          <p>Made in Jamaica 🇯🇲</p>
        </div>
      </div>
    </footer>
  );
}
