
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Club } from '@/app/dashboard/clubs/page';

interface EditClubDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
  onClubUpdated: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Club name is required'),
  description: z.string().min(1, 'Club description is required'),
  inchargeStaffId: z.string().min(1, 'Club Incharge Staff ID is required'),
  presidentRegno: z.string().min(1, "President's Reg No. is required"),
  vicePresidentRegno: z.string().min(1, "Vice President's Reg No. is required"),
  secretaryRegno: z.string().min(1, "Secretary's Reg No. is required"),
  profilePic: z.instanceof(FileList).optional(),
});

export function EditClubDialog({ isOpen, onOpenChange, club, onClubUpdated }: EditClubDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      inchargeStaffId: '',
      presidentRegno: '',
      vicePresidentRegno: '',
      secretaryRegno: '',
    },
  });

  useEffect(() => {
    if (club) {
        form.reset({
            name: club.name,
            description: club.description,
            inchargeStaffId: club.officials.inchargeStaffId,
            presidentRegno: club.officials.presidentRegno,
            vicePresidentRegno: club.officials.vicePresidentRegno,
            secretaryRegno: club.officials.secretaryRegno,
        });
    }
  }, [club, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let profilePicUrl = club.profilePicUrl || '';
      const imageFile = values.profilePic?.[0];

      if (imageFile) {
        const storageRef = ref(storage, `club_pictures/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        profilePicUrl = await getDownloadURL(uploadResult.ref);
      }
      
      const clubDocRef = doc(db, 'clubs', club.id);

      await updateDoc(clubDocRef, {
        name: values.name,
        description: values.description,
        profilePicUrl,
        officials: {
          inchargeStaffId: values.inchargeStaffId,
          presidentRegno: values.presidentRegno,
          vicePresidentRegno: values.vicePresidentRegno,
          secretaryRegno: values.secretaryRegno,
        },
      });
      
      onClubUpdated();

    } catch (error: any) {
      console.error("Error updating club:", error);
      toast({
        variant: 'destructive',
        title: 'Error updating club',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Club: {club.name}</DialogTitle>
          <DialogDescription>
            Update the details for this club.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profilePic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Profile Picture (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...form.register('profilePic')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium border-t pt-4">Club Officials</h3>
            <FormField
              control={form.control}
              name="inchargeStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Incharge (Staff ID)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="presidentRegno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>President (Reg No.)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="vicePresidentRegno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vice President (Reg No.)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="secretaryRegno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secretary (Reg No.)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
