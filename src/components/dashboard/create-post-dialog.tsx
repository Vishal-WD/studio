
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
import { PlusCircle, Paperclip, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_BASE64_SIZE_BYTES = 1048487; // Firestore's 1MB limit for a field
const COMPRESSION_QUALITY = 0.7; // 70% quality
const MAX_IMAGE_DIMENSION = 1280; // Max width/height of 1280px

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<{dataUrl: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ variant: "destructive", title: "Error", description: `Image file size should not exceed ${MAX_IMAGE_SIZE_MB}MB.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Resize logic
          if (width > height) {
            if (width > MAX_IMAGE_DIMENSION) {
              height *= MAX_IMAGE_DIMENSION / width;
              width = MAX_IMAGE_DIMENSION;
            }
          } else {
            if (height > MAX_IMAGE_DIMENSION) {
              width *= MAX_IMAGE_DIMENSION / height;
              height = MAX_IMAGE_DIMENSION;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL(file.type, COMPRESSION_QUALITY);
            
            if (dataUrl.length > MAX_BASE64_SIZE_BYTES) {
                 toast({ variant: "destructive", title: "Error", description: "After compression, the image is still too large. Please select a smaller or less complex file." });
                 return;
            }

            setImage({ dataUrl });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };


  const removeImage = () => {
    setImage(null);
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

      if (image) {
        if (image.dataUrl.length > MAX_BASE64_SIZE_BYTES) {
            toast({ variant: "destructive", title: "Upload Error", description: "The selected image is too large to save. Please choose a smaller file." });
            setIsSubmitting(false);
            return;
        }
        postData.imageUrl = image.dataUrl;
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
        description: error.message || "Could not create post. Please try again.",
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

            {image && (
              <div className="relative group">
                <Image 
                    src={image.dataUrl} 
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
