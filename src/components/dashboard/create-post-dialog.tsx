"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Image as ImageIcon, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would handle form data submission here.
    toast({
      title: "Post created!",
      description: "Your post has been successfully shared.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new post</DialogTitle>
          <DialogDescription>
            Share an update, event, or announcement with the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea placeholder="What's on your mind?" id="content" required />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Attach an Image
              </Label>
              <Input id="image" type="file" accept="image/*" />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="attachment" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Attach a File
              </Label>
              <Input id="attachment" type="file" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Post</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
