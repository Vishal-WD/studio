
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { QuickLink } from '@/app/dashboard/resources/page';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  url: z.string().url('Please enter a valid URL.'),
  order: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0, 'Order must be a positive number.')
  ),
});

interface QuickLinkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingLink?: QuickLink | null;
}

export function QuickLinkDialog({ isOpen, onOpenChange, existingLink }: QuickLinkDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!existingLink;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      order: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: existingLink?.title || '',
        url: existingLink?.url || '',
        order: existingLink?.order || 0,
      });
    }
  }, [existingLink, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const linkData = {
        ...values,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && existingLink) {
        await updateDoc(doc(db, 'quicklinks', existingLink.id), linkData);
        toast({ title: 'Success', description: 'Quick Link updated successfully.' });
      } else {
        await addDoc(collection(db, 'quicklinks'), { ...linkData, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Quick Link added successfully.' });
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving quick link:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save the link.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Quick Link' : 'Add a New Quick Link'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isSubmitting} />
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
