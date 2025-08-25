
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementItem, type Announcement } from './announcement-item';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ImageFocusDialog } from './image-focus-dialog';

export function LatestAnnouncementsFeed() {
  const { userData, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !userData) {
      if(!authLoading) setLoading(false);
      return;
    }
    setLoading(true);

    if (userData.department) {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('authorDepartment', '==', userData.department),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const unsubscribe = onSnapshot(announcementsQuery, (querySnapshot) => {
        const announcementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAnnouncements(announcementsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching latest announcements:", error);
        toast({ variant: 'destructive', title: "Permissions Error", description: "Could not fetch announcements. You may need to have an index created in Firestore."})
        setLoading(false);
      });
  
      return () => unsubscribe();

    } else {
      setAnnouncements([]);
      setLoading(false);
    }
    
  }, [userData, authLoading, toast]);
  
  const handleImageClick = (imageUrl: string) => {
    if (!imageUrl) return;
    setFocusedImage(imageUrl);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Latest Announcements</h2>
            <Button asChild variant="link">
            <Link href="/dashboard/announcements">
                View All <ArrowRight className="ml-2" />
            </Link>
            </Button>
        </div>
        {loading || authLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map(announcement => <AnnouncementItem key={announcement.id} announcement={announcement} onImageClick={handleImageClick} />)}
          </div>
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="py-12">
              <p className="text-center text-foreground">No recent announcements found for you.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ImageFocusDialog
          isOpen={!!focusedImage}
          onOpenChange={(isOpen) => !isOpen && setFocusedImage(null)}
          imageUrl={focusedImage}
      />
    </>
  );
}
