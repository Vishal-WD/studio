
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { CreateEventDialog } from '@/components/dashboard/create-event-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { EventItem, type Event } from '@/components/dashboard/event-item';
import { isFuture, parseISO } from 'date-fns';

export default function EventsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsData);
      setLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoadingEvents(false);
    });

    return () => unsubscribe();
  }, []);

  const upcomingEvents = useMemo(() => {
    // Get today's date at midnight for a consistent comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(event => isFuture(parseISO(event.date)) || parseISO(event.date) >= today);
  }, [events]);

  const canCreateEvent = userData?.role === 'admin' || userData?.role === 'faculty';

  return (
    <div className="max-w-7xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Campus Events</h1>
        </div>
        {authLoading ? (
            <Skeleton className="h-10 w-32" />
        ) : (
            canCreateEvent && <CreateEventDialog />
        )}
      </div>
    
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loadingEvents || authLoading ? (
          <>
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
          </>
        ) : upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => <EventItem key={event.id} event={event} />)
        ) : (
          <Card className="col-span-full border-2 border-primary">
            <CardContent className="py-12">
              <div className="text-center text-foreground">
                <p>No upcoming events have been created yet.</p>
                 <p className="text-sm">If you are a staff member, try creating one!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
