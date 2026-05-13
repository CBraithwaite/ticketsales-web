import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TicketSales Scanner',
  description: 'Scan tickets at the gate',
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
