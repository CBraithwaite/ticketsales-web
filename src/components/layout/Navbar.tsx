'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Ticket,
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  CalendarDays,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Browse Events', href: '/', icon: CalendarDays },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (pathname.startsWith('/scanner/app')) return null;

  const isAuthed = status === 'authenticated';
  const initials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Ticket className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">TicketSales</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(pathname === link.href && 'bg-muted')}
            >
              <Link href={link.href}>
                <link.icon className="h-4 w-4 mr-1" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/me">
                    <User className="h-4 w-4 mr-2" /> My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/organizer">
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Organizer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setSheetOpen(false)}
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              <Separator className="my-3" />
              {isAuthed ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setSheetOpen(false)}
                  >
                    <Link href="/me">
                      <User className="h-4 w-4 mr-2" /> My Account
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setSheetOpen(false)}
                  >
                    <Link href="/organizer">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Organizer
                    </Link>
                  </Button>
                  <Separator className="my-3" />
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setSheetOpen(false)}
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button
                    className="justify-start"
                    asChild
                    onClick={() => setSheetOpen(false)}
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
