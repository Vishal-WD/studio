import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog';

export default function PostsPage() {
  return (
    <div className="max-w-7xl mx-auto">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Community Posts</h1>
          <p className="text-muted-foreground">Catch up on announcements and what's on everyone's mind.</p>
        </div>
        <CreatePostDialog />
      </div>
    
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Community posts and announcements will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
