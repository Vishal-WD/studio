
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { CreateAnnouncementDialog } from '@/components/dashboard/create-announcement-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import { AnnouncementItem, type Announcement } from '@/components/dashboard/announcement-item';
import { useToast } from '@/hooks/use-toast';

export default function AnnouncementsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !userData) {
      if (!authLoading) setLoadingAnnouncements(false);
      return;
    };

    setLoadingAnnouncements(true);

    if (userData.department) {
      const announcementsQuery = query(
        collection(db, 'announcements'), 
        where('authorDepartment', '==', userData.department)
      );
      
      const unsubscribe = onSnapshot(announcementsQuery, (querySnapshot) => {
        const announcementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)); // Manual sort
        setAnnouncements(announcementsData);
        setLoadingAnnouncements(false);
      }, (error) => {
        console.error("Error fetching announcements:", error);
        toast({ variant: 'destructive', title: "Permissions Error", description: "Could not fetch announcements. You may need to have an index created in Firestore."})
        setLoadingAnnouncements(false);
      });
      
      return () => unsubscribe();
    } else {
      setAnnouncements([]);
      setLoadingAnnouncements(false);
    }

  }, [userData, authLoading, toast]);

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
  };

  const canCreateAnnouncement = userData?.designation === 'dean' || userData?.designation === 'hod';

  return (
    <>
    <div className="max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Community Announcements</h1>
        </div>
        {authLoading ? (
            <Skeleton className="h-10 w-44" />
        ) : (
            canCreateAnnouncement && <CreateAnnouncementDialog />
        )}
      </div>
    
      <div className="space-y-4">
        {loadingAnnouncements || authLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : announcements.length > 0 ? (
          announcements.map(announcement => <AnnouncementItem key={announcement.id} announcement={announcement} onImageClick={handleImageClick} />)
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="py-12">
              <div className="text-center text-foreground">
                <p>No announcements found for you yet.</p>
                 <p className="text-sm">If you are a HOD or Dean, try creating one!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    
    <ImageFocusDialog
        isOpen={!!focusedImage}
        onOpenChange={(isOpen) => !isOpen && setFocusedImage(null)}
        imageUrl={focusedImage}
    />
    </>
  );
}
