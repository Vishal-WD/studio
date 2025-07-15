import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function PostsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts</CardTitle>
        <CardDescription>Community posts and announcements.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Posts page content will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
