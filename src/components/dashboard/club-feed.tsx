import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare } from "lucide-react";
import Image from "next/image";

const clubPosts = [
  {
    club: "Photography Club",
    clubInitial: "PC",
    post: "Our latest photo walk was a huge success! Check out some of the amazing shots captured by our members.",
    image: "https://placehold.co/800x600.png",
    aiHint: "group photography",
    likes: 42,
    comments: 8,
  },
  {
    club: "Coding Innovators",
    clubInitial: "CI",
    post: "We're excited to announce our next workshop on 'Advanced React Patterns'. Limited seats available, sign up now!",
    likes: 78,
    comments: 15,
  },
];

export function ClubFeed() {
  return (
    <div className="mt-8">
      <h2 className="font-headline text-2xl font-semibold mb-4">Club Updates</h2>
      <div className="space-y-6">
        {clubPosts.map((post) => (
          <Card key={post.club} className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarFallback>{post.clubInitial}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-headline text-base">{post.club}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{post.post}</p>
              {post.image && (
                <Image
                  src={post.image}
                  alt="Club post image"
                  width={800}
                  height={600}
                  className="rounded-lg object-cover w-full"
                  data-ai-hint={post.aiHint}
                />
              )}
            </CardContent>
            <CardFooter className="flex gap-4 border-t pt-4">
              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary cursor-pointer">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">{post.likes}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{post.comments}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
