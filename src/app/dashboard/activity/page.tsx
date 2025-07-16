
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import Link from 'next/link';
import { PostItem, type Post as PostType } from '@/components/dashboard/post-item';
import { type Event as EventType } from '@/components/dashboard/event-item';

type PostActivity = PostType & { type: 'post' };
type EventActivity = EventType & { type: 'event' };
type Activity = PostActivity | EventActivity;

const EventItem = ({ event, onDelete, onImageClick }: { event: EventActivity, onDelete: (eventId: string) => void, onImageClick: (imageUrl: string) => void }) => {
    const formattedDate = event.createdAt ? formatDistanceToNow(new Date(event.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';
  
    return (
      <Card className="shadow-sm overflow-hidden">
         {event.imageUrl && (
            <div className="w-full h-64 relative bg-muted cursor-pointer" onClick={() => onImageClick(event.imageUrl!)}>
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
            </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
                <CardDescription>Event Created</CardDescription>
                <CardTitle className="font-headline text-lg">
                    <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                        {event.title}
                    </Link>
                </CardTitle>
            </div>
             <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(event.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
            <p className="text-muted-foreground line-clamp-3">{event.description}</p>
        </CardContent>
      </Card>
    );
  };


export default function ActivityPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'post' | 'event'} | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user && userData) {
      setLoading(true);
      
      const postsQuery = query(
        collection(db, 'posts'), 
        where('authorId', '==', user.uid)
        // Removed: orderBy('createdAt', 'desc') to avoid needing an index.
      );
      const eventsQuery = query(
        collection(db, 'events'), 
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as PostActivity));
        setActivities(prev => {
            const otherActivities = prev.filter(a => a.type !== 'post');
            const all = [...otherActivities, ...postsData].sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            return all;
        });
        setLoading(false);
      });

      const unsubscribeEvents = onSnapshot(eventsQuery, (querySnapshot) => {
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'event', ...doc.data() } as EventActivity));
         setActivities(prev => {
            const otherActivities = prev.filter(a => a.type !== 'event');
            const all = [...otherActivities, ...eventsData].sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            return all;
        });
        setLoading(false);
      });

      return () => {
        unsubscribePosts();
        unsubscribeEvents();
      };

    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, userData, authLoading]);
  
  const handleDeleteClick = (id: string, type: 'post' | 'event') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    const collectionName = type === 'post' ? 'posts' : 'events';

    try {
        await deleteDoc(doc(db, collectionName, id));
        toast({ title: "Success", description: `${type === 'post' ? 'Post' : 'Event'} deleted successfully.` });
    } catch (error: any) {
        console.error(`Error deleting ${type}:`, error);
        toast({ variant: "destructive", title: "Error", description: `Could not delete ${type}.` });
    } finally {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }
  };


  return (
    <>
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">My Activity</h1>
        <p className="text-muted-foreground">A collection of all the posts and events you've created.</p>
      </div>

      <div className="space-y-4">
        {loading || authLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : activities.length > 0 ? (
          activities.map(activity => {
            if (activity.type === 'post') {
                return (
                    <PostItem 
                        key={`post-${activity.id}`} 
                        post={activity} 
                        onImageClick={handleImageClick}
                        onDelete={() => handleDeleteClick(activity.id, 'post')}
                    />
                )
            }
            if (activity.type === 'event') {
                return <EventItem key={`event-${activity.id}`} event={activity} onDelete={(id) => handleDeleteClick(id, 'event')} onImageClick={handleImageClick} />
            }
            return null;
          })
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>You haven't created any posts or events yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    
    <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemType={itemToDelete?.type}
    />
    
    <ImageFocusDialog
        isOpen={!!focusedImage}
        onOpenChange={(isOpen) => !isOpen && setFocusedImage(null)}
        imageUrl={focusedImage}
    />
    </>
  );
}
