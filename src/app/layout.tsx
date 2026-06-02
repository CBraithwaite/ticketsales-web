import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Choice Stubs — Event Tickets',
  description:
    'Find and book tickets for concerts, parties, stage shows, and festivals near you.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(dmSans.variable, jakarta.variable)}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
