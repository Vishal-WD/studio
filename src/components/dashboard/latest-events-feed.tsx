
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { EventItem, type Event } from './event-item';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LatestEventsFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
        collection(db, 'events'), 
        orderBy('createdAt', 'desc'),
        limit(3)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching latest events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-semibold">Latest Events</h2>
        <Button asChild variant="link">
          <Link href="/dashboard/events">
            View All <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </div>
      {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
          </div>
      ) : events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => <EventItem key={event.id} event={event} />)}
        </div>
      ) : (
        <Card className="border-2 border-primary">
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No recent events found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
