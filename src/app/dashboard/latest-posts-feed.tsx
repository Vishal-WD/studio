
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, where, getDocs, orderBy } from 'firebase/firestore';
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

    const isPrivileged = userData.designation === 'dean' || userData.designation === 'hod';

    let unsubscribe: () => void = () => {};

    if (userData.role === 'admin') {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postsData);
        setLoading(false);
      }, (error) => {
        console.error("Admin post fetch error:", error);
        setLoading(false);
      });
    } else if (isPrivileged) {
      const departmentPostsQuery = query(
        collection(db, 'posts'),
        where('authorDepartment', '==', userData.department)
      );
      const adminPostsQuery = query(
        collection(db, 'posts'),
        where('authorRole', '==', 'admin')
      );
      
      const unsubDepartment = onSnapshot(departmentPostsQuery, (deptSnapshot) => {
        const deptPosts = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        const unsubAdmin = onSnapshot(adminPostsQuery, (adminSnapshot) => {
          const adminPosts = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
          
          const combined = [...deptPosts, ...adminPosts];
          const uniquePosts = Array.from(new Map(combined.map(p => [p.id, p])).values());
          
          uniquePosts.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          
          setPosts(uniquePosts.slice(0, 5));
          setLoading(false);
        }, (error) => {
          console.error("Privileged admin post fetch error:", error);
          setLoading(false);
        });
        unsubscribe = () => unsubAdmin();
      }, (error) => {
        console.error("Privileged department post fetch error:", error);
        setLoading(false);
      });
      
      const mainUnsubscribe = unsubDepartment;
      unsubscribe = () => {
        mainUnsubscribe();
      };

    } else if (userData.department) {
       const postsQuery = query(
        collection(db, 'posts'),
        where('authorDepartment', '==', userData.department),
        where('authorRole', '!=', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
       unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postsData);
        setLoading(false);
       }, (error) => {
         console.error("Standard user post fetch error:", error);
         setLoading(false);
       });
    } else {
      setPosts([]);
      setLoading(false);
    }
    
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
    
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
