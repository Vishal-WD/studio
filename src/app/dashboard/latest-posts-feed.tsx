
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, where, orderBy } from 'firebase/firestore';
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

    let postsQuery;
    const isPrivileged = userData.designation === 'dean' || userData.designation === 'hod';

    if (userData.role === 'admin') {
      // Admins see all posts, sorted by creation date
      postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
    } else if (isPrivileged) {
      // HODs/Deans see posts from their department OR posts from any admin.
      // We fetch more and filter client-side because Firestore doesn't support complex OR queries easily.
      postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10)); 
    } else if (userData.department) {
      // Other users only see posts from their own department
       postsQuery = query(
        collection(db, 'posts'),
        where('authorDepartment', '==', userData.department),
        where('authorRole', '!=', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
    } else {
      // If user has no department, they see no posts.
      setPosts([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
        let postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

        if (isPrivileged && userData.role !== 'admin') {
            postsData = postsData.filter(post => 
                post.authorDepartment === userData.department || post.authorRole === 'admin'
            );
        }
        
        // Final slice to ensure the limit is respected after any client-side filtering
        const finalPosts = postsData.slice(0, 5);
          
        setPosts(finalPosts);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching latest posts:", error);
        setLoading(false);
    });

    return () => unsubscribe();
    
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
