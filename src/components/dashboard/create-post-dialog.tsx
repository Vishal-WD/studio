
"use client";

import { useState, useRef } from "react";
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
import { PlusCircle, Paperclip, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit for Base64
        toast({ variant: "destructive", title: "Error", description: "Image file size should not exceed 1MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageBase64(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setContent("");
    removeImage();
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
      toast({ variant: "destructive", title: "Error", description: "Post content cannot be empty." });
      return;
    }
    if (!user || !userData) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to post." });
      return;
    }
    
    // Check if user is authorized
    const isAuthorized = userData.designation === 'dean' || userData.designation === 'hod';
    if (!isAuthorized) {
        toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to create posts." });
        return;
    }

    setIsSubmitting(true);
    try {
      const postData: any = {
        authorId: user.uid,
        authorName: userData.username,
        authorDesignation: userData.designation,
        content: content,
        createdAt: serverTimestamp(),
        authorDepartment: userData.department || "",
      };

      if (imageBase64) {
        postData.imageUrl = imageBase64;
      }

      await addDoc(collection(db, "posts"), postData);

      toast({
        title: "Post created!",
        description: "Your post has been successfully shared.",
      });
      
      resetForm();
      setOpen(false); 

    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create post. The data might be too large.",
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
            Share an update, event, or announcement.
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
                rows={4}
              />
            </div>

            {imageBase64 && (
              <div className="relative group">
                <Image 
                    src={imageBase64} 
                    alt="Image preview" 
                    width={500}
                    height={300}
                    className="rounded-md object-cover max-h-60 w-full" 
                />
                <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity"
                    onClick={removeImage}
                    disabled={isSubmitting}
                >
                    <X className="h-4 w-4"/>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
            />
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
            >
                <Paperclip className="mr-2 h-4 w-4" />
                Add Image
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
