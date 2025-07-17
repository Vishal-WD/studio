
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { PostItem, type Post } from './post-item';
import { Card, CardContent } from '../ui/card';
import { ImageFocusDialog } from './image-focus-dialog';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function LatestPostsFeed() {
  const { userData, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userData) {
      if(!authLoading) setLoading(false);
      return;
    }
    setLoading(true);

    // Users should only see posts from their own department.
    if (userData.department) {
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorDepartment', '==', userData.department),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))
        setPosts(postsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching latest posts:", error);
        toast({ variant: 'destructive', title: "Permissions Error", description: "Could not fetch posts. You may need to have an index created in Firestore."})
        setLoading(false);
      });
  
      return () => unsubscribe();

    } else {
      // If user has no department, they see no posts.
      setPosts([]);
      setLoading(false);
    }
    
  }, [userData, authLoading]);
  
  const handleImageClick = (imageUrl: string) => {
    if (!imageUrl) return;
    setFocusedImage(imageUrl);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Latest Posts</h2>
            <Button asChild variant="link">
            <Link href="/dashboard/posts">
                View All <ArrowRight className="ml-2" />
            </Link>
            </Button>
        </div>
        {loading || authLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => <PostItem key={post.id} post={post} onImageClick={handleImageClick} />)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No recent posts found for you.</p>
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
