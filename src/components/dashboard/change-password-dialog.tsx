
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

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
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    setReauthError(null);

    try {
      await updatePassword(user, values.newPassword);
      toast({ title: 'Success', description: 'Your password has been changed successfully.' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        setReauthError('This is a sensitive operation. Please log out and log back in before changing your password.');
      } else {
        toast({
          variant: 'destructive',
          title: 'Password Change Failed',
          description: error.message || 'Could not update your password. Please try again.',
        });
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (form.formState.isSubmitting) return;
    if (!open) {
        form.reset();
        setReauthError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {reauthError && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Re-authentication Required</AlertTitle>
                  <AlertDescription>
                      {reauthError}
                  </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
                  <div className="relative">
                    <FormControl>
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={form.formState.isSubmitting}>
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
