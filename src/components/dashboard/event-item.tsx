
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin, User } from 'lucide-react';

export interface Event {
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

export const EventItem = ({ event }: { event: Event }) => {
  return (
    <Link href={`/dashboard/events/${event.id}`} className="flex">
        <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 w-full border-2 border-primary">
        {event.imageUrl ? (
            <CardHeader className="p-0">
            <Image
                src={event.imageUrl}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
            />
            </CardHeader>
        ) : (
            <CardHeader className="p-0">
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-foreground/50" />
                </div>
            </CardHeader>
        )}
        <CardContent className="p-4 flex-1">
            <CardTitle className="font-headline text-lg mb-2">{event.title}</CardTitle>
            <CardDescription className="line-clamp-3">{event.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 bg-muted/50 flex flex-col items-start gap-2">
            <div className="flex items-center text-sm text-foreground gap-2">
            <Calendar />
            <span>{format(new Date(event.date), "MMMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center text-sm text-foreground gap-2">
            <MapPin />
            <span>{event.location}</span>
            </div>
            <div className="flex items-center text-sm text-foreground gap-2 pt-2">
            <User />
            <span>Created by {event.authorName}</span>
            </div>
            <div className="w-full text-right mt-2">
                 <Button variant="link" className="p-0 h-auto text-primary">
                    View Details <ArrowRight />
                </Button>
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
};
