
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  authorName: string;
  authorId: string;
  authorDepartment?: string;
  authorDesignation?: 'dean' | 'hod' | 'club_incharge';
  content: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const PostItem = ({ post }: { post: Post }) => {
  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const formattedDate = post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';

  const getDesignationDisplay = () => {
    if (!post.authorDesignation) return null;
    const designation = post.authorDesignation.replace('_', ' ');
    if ((post.authorDesignation === 'dean' || post.authorDesignation === 'hod') && post.authorDepartment) {
      return <p className="text-xs text-muted-foreground capitalize">{designation} of {post.authorDepartment}</p>;
    }
    return <p className="text-xs text-muted-foreground capitalize">{designation}</p>;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-semibold">{post.authorName}</p>
              {getDesignationDisplay()}
            </div>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  );
};


export default function PostsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (userData?.department) {
      const q = query(
        collection(db, 'posts'), 
        where('authorDepartment', '==', userData.department),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postsData);
        setLoadingPosts(false);
      }, (error) => {
        console.error("Error fetching posts:", error);
        // This likely means the required index is not created.
        setLoadingPosts(false);
      });

      return () => unsubscribe();
    } else if (!authLoading) {
      // If we're not loading auth and there's no department, there are no posts to fetch
      setLoadingPosts(false);
    }
  }, [userData, authLoading]);

  const canCreatePost = userData?.designation === 'dean' || userData?.designation === 'hod' || userData?.designation === 'club_incharge';

  return (
    <div className="max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Community Posts</h1>
          <p className="text-muted-foreground">Catch up on announcements and what's on everyone's mind in your department.</p>
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
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : posts.length > 0 ? (
          posts.map(post => <PostItem key={post.id} post={post} />)
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>No posts found for your department yet.</p>
                 <p className="text-sm">If you are a HOD, Dean, or Club Incharge, try creating one!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
