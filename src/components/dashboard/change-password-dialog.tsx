
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updatePassword } from 'firebase/auth';

const formSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ isOpen, onOpenChange }: ChangePasswordDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
      return;
    }

    try {
      await updatePassword(user, values.newPassword);
      toast({ title: 'Success', description: 'Your password has been changed successfully.' });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      let description = 'Could not update your password. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        description = 'This is a sensitive operation. Please log out and log back in before changing your password.';
      }
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: description,
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!form.formState.isSubmitting) {
        if (!open) {
            form.reset();
        }
        onOpenChange(open);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter a new password for your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
