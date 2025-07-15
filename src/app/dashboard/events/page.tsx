
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateEventDialog } from '@/components/dashboard/create-event-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Calendar, MapPin, User } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  authorName: string;
  registrationLink?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const EventItem = ({ event }: { event: Event }) => {
  return (
    <Link href={`/dashboard/events/${event.id}`} className="flex">
        <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 w-full">
        {event.imageUrl && (
            <CardHeader className="p-0">
            <Image
                src={event.imageUrl}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
            />
            </CardHeader>
        )}
        <CardContent className="p-4 flex-1">
            <CardTitle className="font-headline text-lg mb-2">{event.title}</CardTitle>
            <CardDescription className="line-clamp-3">{event.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 bg-muted/50 flex flex-col items-start gap-2">
            <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.date), "MMMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-2 pt-2">
            <User className="h-4 w-4" />
            <span>Created by {event.authorName}</span>
            </div>
            <div className="w-full text-right mt-2">
                 <Button variant="link" className="p-0 h-auto text-primary">
                    View Details <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
};


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

  const canCreateEvent = userData?.role === 'admin' || userData?.role === 'faculty';

  return (
    <div className="max-w-7xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Campus Events</h1>
          <p className="text-muted-foreground">Find out about upcoming and past events on campus.</p>
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
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
          </>
        ) : events.length > 0 ? (
          events.map(event => <EventItem key={event.id} event={event} />)
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>No events have been created yet.</p>
                 <p className="text-sm">If you are a staff member, try creating one!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
