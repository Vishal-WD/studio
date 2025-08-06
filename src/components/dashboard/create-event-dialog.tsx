
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
import { Input } from "@/components/ui/input";
import { PlusCircle, Paperclip, X, Loader2, Calendar as CalendarIcon, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MAX_IMAGE_SIZE_BYTES = 350 * 1024; // 350KB
const MAX_BASE64_SIZE_BYTES = 1048487; // Firestore's 1MB limit for a field
const COMPRESSION_QUALITY = 0.7; // 70% quality
const MAX_IMAGE_DIMENSION = 1280; // Max width/height of 1280px

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [registrationLink, setRegistrationLink] = useState("");
  const [image, setImage] = useState<{dataUrl: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "Error", description: `Image file size should not exceed 350KB.` });
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
    setTitle("");
    setDescription("");
    setLocation("");
    setDate(undefined);
    setRegistrationLink("");
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
    if (!title.trim() || !description.trim() || !location.trim() || !date) {
      toast({ variant: "destructive", title: "Error", description: "Please fill out all required fields." });
      return;
    }
    if (!user || !userData) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create an event." });
      return;
    }
    
    const isAuthorized = userData.role === 'admin' || userData.role === 'faculty';
    if (!isAuthorized) {
        toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to create events." });
        return;
    }

    setIsSubmitting(true);
    try {
      const eventData: any = {
        authorId: user.uid,
        authorName: userData.username,
        title,
        description,
        location,
        date: format(date, "yyyy-MM-dd"),
        createdAt: serverTimestamp(),
      };

      if (registrationLink.trim()) {
        eventData.registrationLink = registrationLink.trim();
      }

      if (image) {
        if (image.dataUrl.length > MAX_BASE64_SIZE_BYTES) {
            toast({ variant: "destructive", title: "Upload Error", description: "The selected image is too large to save. Please choose a smaller file." });
            setIsSubmitting(false);
            return;
        }
        eventData.imageUrl = image.dataUrl;
      }

      await addDoc(collection(db, "events"), eventData);

      toast({
        title: "Event created!",
        description: "Your event has been successfully published.",
      });
      
      resetForm();
      setOpen(false); 

    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create event. Please try again.",
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
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new event</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new campus event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Annual Tech Symposium"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                placeholder="Tell us more about the event..."
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Main Auditorium"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="grid w-full items-center gap-1.5">
                    <Label>Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

             <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="registrationLink">Registration Link (Optional)</Label>
              <Input
                id="registrationLink"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://forms.gle/..."
                disabled={isSubmitting}
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
          <DialogFooter className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
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
               <p className="text-xs text-foreground">Max file size: 350KB</p>
            </div>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !description.trim() || !location.trim() || !date}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
