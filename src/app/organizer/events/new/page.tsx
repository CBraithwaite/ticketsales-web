import Link from 'next/link';
import CreateEventForm from '@/components/events/CreateEventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CalendarPlus } from 'lucide-react';

export const metadata = { title: 'Create event · TicketSales' };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
        <Link href="/organizer"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
      </Button>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CalendarPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
          <p className="text-sm text-muted-foreground">Set up your event details</p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <CreateEventForm />
        </CardContent>
      </Card>
    </div>
  );
}
