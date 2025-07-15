
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (user) {
      // Query without ordering to avoid needing a composite index
      const q = query(
        collection(db, 'posts'), 
        where('authorId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        // Sort posts on the client-side
        postsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        setPosts(postsData);
        setLoadingPosts(false);
      }, (error) => {
        console.error("Error fetching user posts:", error);
        setLoadingPosts(false);
      });

      return () => unsubscribe();
    } else if (!authLoading) {
      setLoadingPosts(false);
    }
  }, [user, authLoading]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">My Activity</h1>
        <p className="text-muted-foreground">A collection of all the posts you've created.</p>
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
                <p>You haven't created any posts yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
