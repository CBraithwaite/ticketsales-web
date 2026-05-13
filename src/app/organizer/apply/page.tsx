import OrganizerApplyForm from '@/components/organizer/OrganizerApplyForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Become an organizer · TicketSales' };

export default function OrganizerApplyPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Become an Organizer</h1>
        <p className="mt-1 text-sm text-muted-foreground">List events and sell tickets through TicketSales</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <OrganizerApplyForm />
        </CardContent>
      </Card>
      <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          <CheckCircle className="h-3 w-3 text-primary" />
          Applications are reviewed within 24 hours
        </p>
      </div>
    </div>
  );
}
