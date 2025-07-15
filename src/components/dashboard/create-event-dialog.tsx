
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Club } from '@/app/dashboard/clubs/page';

interface CreateEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
  onEventCreated: () => void;
}

export function CreateEventDialog({ isOpen, onOpenChange, club, onEventCreated }: CreateEventDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    // In a real app, you would add logic here to:
    // 1. Get form data
    // 2. Validate it
    // 3. Upload event image to storage if there is one
    // 4. Save event data to a new 'events' collection in Firestore, linking it to the club.id
    console.log("Creating event for club:", club.name);
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    onEventCreated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post New Event for {club.name}</DialogTitle>
          <DialogDescription>
            Fill in the details for the new event. It will be publicly visible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" placeholder="E.g., Annual Hackathon" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Event Description</Label>
                    <Textarea id="description" placeholder="A brief description of the event." required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input id="date" type="date" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location">Location / Venue</Label>
                    <Input id="location" placeholder="E.g., Main Auditorium" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="image">Event Poster/Image</Label>
                    <Input id="image" type="file" accept="image/*" />
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Event'}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
