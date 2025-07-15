
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { PostItem, type Post } from './post-item';
import { Card, CardContent } from '../ui/card';
import { ImageFocusDialog } from './image-focus-dialog';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LatestPostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedImage, setFocusedImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
        collection(db, 'posts'), 
        orderBy('createdAt', 'desc'),
        limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching latest posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleImageClick = (imageUrl: string) => {
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
        {loading ? (
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
              <p className="text-center text-muted-foreground">No recent posts found.</p>
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
