
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
import { PlusCircle, Paperclip, X, Loader2, File as FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

const MAX_FILE_SIZE_BYTES = 350 * 1024; // 350KB
const MAX_BASE64_SIZE_BYTES = 1048487; // Firestore's 1MB limit for a field

interface FileAttachment {
    dataUrl: string;
    name: string;
    type: string;
}

export function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "Error", description: `File size should not exceed 350KB.` });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = (e) => {
          const dataUrl = e.target?.result as string;
           if (dataUrl.length > MAX_BASE64_SIZE_BYTES) {
                toast({ variant: "destructive", title: "Error", description: "The selected file is too large to save. Please choose a smaller file." });
                return;
            }
          setAttachment({
              dataUrl,
              name: file.name,
              type: file.type
          });
      };
      reader.readAsDataURL(file);
    }
  };


  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setContent("");
    removeAttachment();
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
      toast({ variant: "destructive", title: "Error", description: "Announcement content cannot be empty." });
      return;
    }
    if (!user || !userData) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create an announcement." });
      return;
    }
    
    const isAuthorized = userData.designation === 'dean' || userData.designation === 'hod';
    if (!isAuthorized) {
        toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to create announcements." });
        return;
    }

    setIsSubmitting(true);
    try {
      const announcementData: any = {
        authorId: user.uid,
        authorName: userData.username,
        authorDesignation: userData.designation || null,
        content: content,
        createdAt: serverTimestamp(),
        authorDepartment: userData.department || "",
      };

      if (attachment) {
        if (attachment.dataUrl.length > MAX_BASE64_SIZE_BYTES) {
            toast({ variant: "destructive", title: "Upload Error", description: "The selected file is too large to save. Please choose a smaller file." });
            setIsSubmitting(false);
            return;
        }
        announcementData.fileUrl = attachment.dataUrl;
        announcementData.fileName = attachment.name;
        announcementData.fileType = attachment.type;
      }


      await addDoc(collection(db, "announcements"), announcementData);

      toast({
        title: "Announcement created!",
        description: "Your announcement has been successfully shared.",
      });
      
      resetForm();
      setOpen(false); 

    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create announcement. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isImage = attachment?.type.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new announcement</DialogTitle>
          <DialogDescription>
            Share an update, event, or important information.
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

            {attachment && (
              <div className="relative group rounded-md border p-2">
                 <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity z-10"
                    onClick={removeAttachment}
                    disabled={isSubmitting}
                >
                    <X className="h-4 w-4"/>
                </Button>

                {isImage ? (
                    <Image 
                        src={attachment.dataUrl} 
                        alt="Image preview" 
                        width={500}
                        height={300}
                        className="rounded-md object-cover max-h-60 w-full" 
                    />
                ) : (
                    <div className="flex items-center gap-3 p-2">
                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                        <div className="flex flex-col">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">{attachment.type}</p>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between items-center">
            <div className="flex items-center gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach File
                </Button>
                <span className="text-xs text-foreground">Max file size: 350KB</span>
            </div>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
