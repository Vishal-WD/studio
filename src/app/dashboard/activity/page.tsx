
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DeletePostDialog } from '@/components/dashboard/delete-post-dialog';
import { useToast } from '@/hooks/use-toast';


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

const PostItem = ({ post, onDelete }: { post: Post, onDelete: (post: Post) => void }) => {
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
            <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(post)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'posts'), 
        where('authorId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
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
  
  const handleDeleteClick = (post: Post) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPost) return;
    try {
        await deleteDoc(doc(db, 'posts', selectedPost.id));
        
        toast({ title: "Success", description: "Post deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting post:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete post." });
    } finally {
        setDeleteDialogOpen(false);
        setSelectedPost(null);
    }
  };


  return (
    <>
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">My Activity</h1>
        <p className="text-muted-foreground">A collection of all the posts you've created.</p>
      </div>

      <div className="space-y-4">
        {loadingPosts || authLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : posts.length > 0 ? (
          posts.map(post => <PostItem key={post.id} post={post} onDelete={handleDeleteClick} />)
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
    
    <DeletePostDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
    />
    </>
  );
}
