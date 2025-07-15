
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const resetForm = () => {
    setContent("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isSubmitting) {
      if (!isOpen) {
        resetForm();
      }
      setOpen(isOpen);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Post content cannot be empty.",
      });
      return;
    }
    if (!user || !userData) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to post." });
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        authorId: user.uid,
        authorName: userData.username,
        authorDepartment: userData.department || "",
        authorDesignation: userData.designation,
        content: content,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "posts"), postData);

      toast({
        title: "Post created!",
        description: "Your post has been successfully shared.",
      });
      
      resetForm();
      setOpen(false); 

    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create post. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new post</DialogTitle>
          <DialogDescription>
            Share an update, event, or announcement with your department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea
                placeholder="What's on your mind?"
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
