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
  DropdownMenuLabel,
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
import {
  Ticket,
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  Tag,
  CircleHelp,
  Shield,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Browse Events', href: '/', icon: CalendarDays },
  { label: 'Pricing', href: '/pricing', icon: Tag },
  { label: 'Help', href: '/help', icon: CircleHelp },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (pathname.startsWith('/scanner/app')) return null;

  const isAuthed = status === 'authenticated';
  const name = session?.user?.name ?? '';
  const email = session?.user?.email ?? '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const isOrganizer = (session?.user as { roles?: string[] })?.roles?.includes('Organizer');
  const isAdmin = (session?.user as { roles?: string[] })?.roles?.includes('Admin');
  const sellHref = isAuthed ? (isOrganizer ? '/organizer' : '/organizer/apply') : '/signup';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="Choice Stubs — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/choicestubs-logo.svg" alt="Choice Stubs" className="h-14 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                'gap-1.5 text-muted-foreground hover:text-foreground',
                pathname === link.href && 'bg-primary/8 text-primary font-medium',
              )}
            >
              <Link href={link.href}>
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-sm font-semibold border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
          >
            <Link href={sellHref}>
              <Ticket className="h-3.5 w-3.5" /> Sell Tickets
            </Link>
          </Button>
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 gap-2 rounded-sm pl-1 pr-2.5 hover:bg-muted"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate text-sm font-medium">
                    {name.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" sideOffset={6}>
                <DropdownMenuLabel className="font-normal">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/me">
                    <User className="mr-2 h-4 w-4" /> My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/me/tickets">
                    <Ticket className="mr-2 h-4 w-4" /> My Tickets
                  </Link>
                </DropdownMenuItem>
                {isOrganizer && (
                  <DropdownMenuItem asChild>
                    <Link href="/organizer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Organizer Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="rounded-sm px-4 font-semibold shadow-sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 pt-8">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/choicestubs-logo.svg" alt="Choice Stubs" className="h-8 w-auto" />
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={cn(
                    'justify-start gap-2 text-muted-foreground',
                    pathname === link.href && 'bg-primary/8 text-primary',
                  )}
                  asChild
                  onClick={() => setSheetOpen(false)}
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}

              <Button
                variant="outline"
                className="justify-start gap-2 font-semibold border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
                asChild
                onClick={() => setSheetOpen(false)}
              >
                <Link href={sellHref}>
                  <Ticket className="h-4 w-4" /> Sell Tickets
                </Link>
              </Button>

              <div className="my-3 border-t" />

              {isAuthed ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setSheetOpen(false)}>
                    <Link href="/me"><User className="h-4 w-4" /> My Account</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setSheetOpen(false)}>
                    <Link href="/me/tickets"><Ticket className="h-4 w-4" /> My Tickets</Link>
                  </Button>
                  {isOrganizer && (
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setSheetOpen(false)}>
                      <Link href="/organizer"><LayoutDashboard className="h-4 w-4" /> Organizer</Link>
                    </Button>
                  )}
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setSheetOpen(false)}>
                      <Link href="/admin"><Shield className="h-4 w-4" /> Admin</Link>
                    </Button>
                  )}
                  <div className="my-3 border-t" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Button variant="outline" asChild onClick={() => setSheetOpen(false)}>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild onClick={() => setSheetOpen(false)}>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
