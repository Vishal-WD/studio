
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import { PostItem, type Post } from '@/components/dashboard/post-item';
import { useToast } from '@/hooks/use-toast';

export default function PostsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !userData) {
      if (!authLoading) setLoadingPosts(false);
      return;
    };

    setLoadingPosts(true);

    if (userData.department) {
      const postsQuery = query(
        collection(db, 'posts'), 
        where('authorDepartment', '==', userData.department)
      );
      
      const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)); // Manual sort
        setPosts(postsData);
        setLoadingPosts(false);
      }, (error) => {
        console.error("Error fetching posts:", error);
        toast({ variant: 'destructive', title: "Permissions Error", description: "Could not fetch posts. You may need to have an index created in Firestore."})
        setLoadingPosts(false);
      });
      
      return () => unsubscribe();
    } else {
      setPosts([]);
      setLoadingPosts(false);
    }

  }, [userData, authLoading, toast]);

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
  };

  const canCreatePost = userData?.designation === 'dean' || userData?.designation === 'hod';

  return (
    <>
    <div className="max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Community Posts</h1>
          <p className="text-muted-foreground">Catch up on announcements and what's on everyone's mind.</p>
        </div>
        {authLoading ? (
            <Skeleton className="h-10 w-32" />
        ) : (
            canCreatePost && <CreatePostDialog />
        )}
      </div>
    
      <div className="space-y-4">
        {loadingPosts || authLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : posts.length > 0 ? (
          posts.map(post => <PostItem key={post.id} post={post} onImageClick={handleImageClick} />)
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>No posts found for you yet.</p>
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
