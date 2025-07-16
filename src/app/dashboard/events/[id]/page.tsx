
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar, Download, Link as LinkIcon, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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

const DetailItem = ({ icon, label, value, children }: { icon: React.ReactNode, label: string, value?: string, children?: React.ReactNode }) => {
    if (!value && !children) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {value && <p className="font-medium">{value}</p>}
          {children}
        </div>
      </div>
    );
  };


export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (typeof id !== 'string') return;
      try {
        const eventDocRef = doc(db, 'events', id);
        const eventDocSnap = await getDoc(eventDocRef);
        if (eventDocSnap.exists()) {
          setEvent({ id: eventDocSnap.id, ...eventDocSnap.data() } as Event);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Event not found.' });
          router.push('/dashboard/events');
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch event details.' });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, router, toast]);
  
  const handleDownload = () => {
    if (!event?.imageUrl) return;
    const link = document.createElement('a');
    link.href = event.imageUrl;
    link.download = `event-${event.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getFormattedLink = (link: string) => {
    if (link.startsWith('http://') || link.startsWith('https://')) {
        return link;
    }
    return `https://${link}`;
  }


  if (loading) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3 space-y-6">
                    <Skeleton className="w-full h-80 rounded-lg" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="md:col-span-2 space-y-6">
                   <Skeleton className="h-48 w-full" />
                   <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!event) {
    return null; // or a 'Not Found' component
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2" />
            Back to Events
        </Button>
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          {event.imageUrl ? (
             <div className="relative group">
                <Image
                    src={event.imageUrl}
                    alt={event.title}
                    width={800}
                    height={500}
                    className="w-full h-auto object-cover rounded-lg border"
                />
                 <Button
                    size="icon"
                    className="absolute top-3 right-3 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={handleDownload}
                >
                    <Download />
                </Button>
            </div>
          ) : (
            <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No Image Provided</p>
            </div>
          )}
          
          <h1 className="text-4xl font-headline font-bold">{event.title}</h1>
          <div className="text-lg text-muted-foreground whitespace-pre-wrap space-y-4">
            <p>{event.description}</p>
            {event.registrationLink && (
              <div className="pt-2">
                <p className="text-sm font-semibold text-foreground">Registration Link:</p>
                <Link 
                  href={getFormattedLink(event.registrationLink)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline break-all text-base"
                >
                  {event.registrationLink}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
            <Card className="sticky top-20 shadow-md">
                <CardContent className="pt-6 space-y-4">
                    <DetailItem icon={<Calendar size={20} />} label="Date" value={format(new Date(event.date), "EEEE, MMMM dd, yyyy")} />
                    <DetailItem icon={<MapPin size={20} />} label="Location" value={event.location} />
                    <DetailItem icon={<User size={20} />} label="Organizer" value={event.authorName} />
                    {event.registrationLink && (
                        <DetailItem icon={<LinkIcon size={20} />} label="Registration">
                             <Button asChild variant="secondary" className="mt-1">
                                <Link href={getFormattedLink(event.registrationLink)} target="_blank" rel="noopener noreferrer">
                                    Register Here
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </DetailItem>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
