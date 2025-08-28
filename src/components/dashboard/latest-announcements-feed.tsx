
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { NoticeItem, type Notice } from './announcement-item';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ImageFocusDialog } from './image-focus-dialog';

export function LatestAnnouncementsFeed() {
  const { userData, loading: authLoading } = useAuth();
  const [allRecentAnnouncements, setAllRecentAnnouncements] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(10) // Fetch latest 10, we will filter on the client
    );

    const unsubscribe = onSnapshot(announcementsQuery, (querySnapshot) => {
      const announcementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setAllRecentAnnouncements(announcementsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching latest notices:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch notices." })
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const announcements = useMemo(() => {
    if (!userData?.department) return [];
    return allRecentAnnouncements.filter(announcement => {
        return announcement.authorDepartment === userData.department;
    }).slice(0, 3); // Limit to 3 for the feed
  }, [allRecentAnnouncements, userData]);

  const handleImageClick = (imageUrl: string) => {
    if (!imageUrl) return;
    setFocusedImage(imageUrl);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Latest Notices</h2>
            <Button asChild variant="link">
            <Link href="/dashboard/announcements">
                View All <ArrowRight />
            </Link>
            </Button>
        </div>
        {loading || authLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map(announcement => <NoticeItem key={announcement.id} notice={announcement} onImageClick={handleImageClick} />)}
          </div>
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="py-12">
              <p className="text-center text-foreground">No recent notices found for you.</p>
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
