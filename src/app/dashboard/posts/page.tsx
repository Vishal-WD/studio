
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageFocusDialog } from '@/components/dashboard/image-focus-dialog';
import { PostItem, type Post } from '@/components/dashboard/post-item';

export default function PostsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const [focusedImage, setFocusedImage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userData) {
      if (!authLoading) setLoadingPosts(false);
      return;
    };

    setLoadingPosts(true);

    const isPrivileged = userData.designation === 'dean' || userData.designation === 'hod';
    let unsubscribePosts: () => void = () => {};
    let unsubscribeAdminPosts: () => void = () => {};

    if (userData.role === 'admin') {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postsData);
        setLoadingPosts(false);
      }, (error) => {
        console.error("Error fetching posts for admin:", error);
        setLoadingPosts(false);
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
      
      unsubscribePosts = onSnapshot(departmentPostsQuery, (deptSnapshot) => {
        const deptPosts = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        unsubscribeAdminPosts = onSnapshot(adminPostsQuery, (adminSnapshot) => {
          const adminPosts = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
          
          const combined = [...deptPosts, ...adminPosts];
          const uniquePosts = Array.from(new Map(combined.map(p => [p.id, p])).values());
          
          uniquePosts.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          
          setPosts(uniquePosts);
          setLoadingPosts(false);
        });
      }, (error) => {
        console.error("Error fetching posts for privileged user:", error);
        setLoadingPosts(false);
      });

    } else if (userData.department) {
      const postsQuery = query(
          collection(db, 'posts'), 
          where('authorDepartment', '==', userData.department),
          where('authorRole', '!=', 'admin')
      );
      unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setPosts(postsData);
        setLoadingPosts(false);
      }, (error) => {
        console.error("Error fetching posts:", error);
        setLoadingPosts(false);
      });
    } else {
      setPosts([]);
      setLoadingPosts(false);
    }
    
    return () => {
      unsubscribePosts();
      unsubscribeAdminPosts();
    };

  }, [userData, authLoading]);

  const handleImageClick = (imageUrl: string) => {
    setFocusedImage(imageUrl);
  };

  const canCreatePost = userData?.role === 'admin' || userData?.designation === 'dean' || userData?.designation === 'hod';

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
                 <p className="text-sm">If you are a HOD, Dean, or Admin, try creating one!</p>
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
