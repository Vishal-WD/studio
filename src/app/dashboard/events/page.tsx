import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function EventsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>Upcoming and past events.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Events page content will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
