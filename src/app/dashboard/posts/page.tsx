
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface Post {
  id: string;
  authorName: string;
  authorId: string;
  authorDepartment?: string;
  authorDesignation?: 'dean' | 'hod' | 'club_incharge';
  content: string;
  imageUrl?: string;
  imagePath?: string;
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
    <Card className="shadow-sm overflow-hidden">
        {post.imageUrl && (
            <div className="w-full h-64 relative bg-muted">
                <Image
                    src={post.imageUrl}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )}
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
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
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    // Fetch all posts, we will filter by department on the client side
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setAllPosts(postsData);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = useMemo(() => {
    if (authLoading || !userData) return [];
    
    // Deans and Admins see all posts
    if (userData.role === 'admin' || userData.designation === 'dean') return allPosts;

    // Students and faculty (who are not HODs) see posts from their own department.
    if(userData.role === 'student' || (userData.role === 'faculty' && userData.designation !== 'hod')) {
        return allPosts.filter(post => post.authorDepartment === userData.department);
    }
    
    // HODs see posts from their own department
    if (userData.designation === 'hod') {
        return allPosts.filter(post => post.authorDepartment === userData.department);
    }

    return [];
  }, [allPosts, userData, authLoading]);

  const canCreatePost = userData?.designation === 'dean' || userData?.designation === 'hod';

  return (
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
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => <PostItem key={post.id} post={post} />)
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
  );
}
