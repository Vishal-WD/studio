
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { CreateAnnouncementDialog } from '@/components/dashboard/create-announcement-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import { NoticeItem, type Notice } from '@/components/dashboard/announcement-item';
import { useToast } from '@/hooks/use-toast';

export default function AnnouncementsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [allAnnouncements, setAllAnnouncements] = useState<Notice[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    
    setLoadingAnnouncements(true);

    const announcementsQuery = query(
      collection(db, 'announcements'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(announcementsQuery, (querySnapshot) => {
      const announcementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setAllAnnouncements(announcementsData);
      setLoadingAnnouncements(false);
    }, (error) => {
      console.error("Error fetching notices:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch notices."})
      setLoadingAnnouncements(false);
    });
    
    return () => unsubscribe();
  }, [authLoading, toast]);

  const announcements = useMemo(() => {
    if (!userData?.department) return [];
    return allAnnouncements.filter(announcement => announcement.authorDepartment === userData.department);
  }, [allAnnouncements, userData]);

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
  };

  const canCreateAnnouncement = userData?.designation === 'dean' || userData?.designation === 'hod';

  return (
    <>
    <div className="max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Community Notices</h1>
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
          announcements.map(announcement => <NoticeItem key={announcement.id} notice={announcement} onImageClick={handleImageClick} />)
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="py-12">
              <div className="text-center text-foreground">
                <p>No notices found for you yet.</p>
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
