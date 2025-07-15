
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, FileText } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import Link from 'next/link';

interface Post {
  id: string;
  type: 'post';
  authorName: string;
  authorId: string;
  authorDepartment?: string;
  authorDesignation?: 'dean' | 'hod' | 'club_incharge';
  content: string;
  imageUrl?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Event {
    id: string;
    type: 'event';
    title: string;
    description: string;
    authorName: string;
    authorId: string;
    imageUrl?: string;
    createdAt: {
      seconds: number;
      nanoseconds: number;
    };
  }

type Activity = Post | Event;

const PostItem = ({ post, onDelete, onImageClick }: { post: Post, onDelete: (activity: Activity) => void, onImageClick: (imageUrl: string) => void }) => {
  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const formattedDate = post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';

  const getDesignationDisplay = () => {
    if (!post.authorDesignation) return null;
    const designation = post.authorDesignation.replace('_', ' ');
    if ((post.authorDesignation === 'dean' || post.authorDesignation === 'hod') && post.authorDepartment) {
      return <p className="text-xs text-muted-foreground capitalize">{designation} of {post.authorDepartment}</p>;
    }
    return <p className="text-xs text-muted-foreground capitalize">{designation}</p>;
  }

  return (
    <Card className="shadow-sm overflow-hidden">
        {post.imageUrl && (
            <div className="w-full h-64 relative bg-muted cursor-pointer" onClick={() => onImageClick(post.imageUrl!)}>
                <Image
                    src={post.imageUrl}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )}
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
             <div>
              <p className="font-semibold">{post.authorName}</p>
              {getDesignationDisplay()}
            </div>
            <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(post)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  );
};


const EventItem = ({ event, onDelete, onImageClick }: { event: Event, onDelete: (activity: Activity) => void, onImageClick: (imageUrl: string) => void }) => {
    const formattedDate = event.createdAt ? formatDistanceToNow(new Date(event.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';
  
    return (
      <Card className="shadow-sm overflow-hidden">
         {event.imageUrl && (
            <div className="w-full h-64 relative bg-muted cursor-pointer" onClick={() => onImageClick(event.imageUrl!)}>
                <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(event)}>
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
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const [isFocusDialogOpen, setFocusDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      
      const postsQuery = query(
        collection(db, 'posts'), 
        where('authorId', '==', user.uid)
      );
      const eventsQuery = query(
        collection(db, 'events'), 
        where('authorId', '==', user.uid)
      );

      const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as Post));
        setActivities(prev => {
            const otherActivities = prev.filter(a => a.type !== 'post');
            const all = [...otherActivities, ...postsData].sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
            return all;
        });
        setLoading(false);
      });

      const unsubscribeEvents = onSnapshot(eventsQuery, (querySnapshot) => {
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'event', ...doc.data() } as Event));
         setActivities(prev => {
            const otherActivities = prev.filter(a => a.type !== 'event');
            const all = [...otherActivities, ...eventsData].sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
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
  }, [user, authLoading]);
  
  const handleDeleteClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setDeleteDialogOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
    setFocusDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity) return;
    const collectionName = selectedActivity.type === 'post' ? 'posts' : 'events';
    try {
        await deleteDoc(doc(db, collectionName, selectedActivity.id));
        toast({ title: "Success", description: `${selectedActivity.type === 'post' ? 'Post' : 'Event'} deleted successfully.` });
    } catch (error: any) {
        console.error(`Error deleting ${selectedActivity.type}:`, error);
        toast({ variant: "destructive", title: "Error", description: `Could not delete ${selectedActivity.type}.` });
    } finally {
        setDeleteDialogOpen(false);
        setSelectedActivity(null);
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
                return <PostItem key={`post-${activity.id}`} post={activity} onDelete={handleDeleteClick} onImageClick={handleImageClick} />
            }
            if (activity.type === 'event') {
                return <EventItem key={`event-${activity.id}`} event={activity} onDelete={handleDeleteClick} onImageClick={handleImageClick} />
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
        itemType={selectedActivity?.type}
    />
    
    <ImageFocusDialog
        isOpen={isFocusDialogOpen}
        onOpenChange={setFocusDialogOpen}
        imageUrl={focusedImage}
    />
    </>
  );
}
