
'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Building, Briefcase, BadgeCheck, UserCircle2, Hash, Group, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function ProfileDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { userData, loading } = useAuth();
  const { toast } = useToast();

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const formatDesignation = (designation?: string) => {
    if (!designation) return '';
    return designation.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const handlePasswordReset = async () => {
    if (!userData?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find your email address.',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, userData.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${userData.email} with instructions to reset your password.`,
      });
      onOpenChange(false); // Close the dialog after sending
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not send password reset email.',
      });
    }
  };

  const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium capitalize">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">My Profile</DialogTitle>
          <DialogDescription>
            Your personal information and account details.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <div className="space-y-6 pt-4">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : userData ? (
          <>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 border-2 border-primary">
                      <AvatarFallback className="text-2xl bg-muted">{getInitials(userData.username)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{userData.username}</h2>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
              <div className="space-y-6 border-t pt-6">
                  <DetailItem icon={<UserCircle2 size={20} />} label="Role" value={userData.role} />
                  <DetailItem icon={<Building size={20} />} label="Department" value={userData.department} />
                  {userData.designation && (
                    <DetailItem icon={<BadgeCheck size={20} />} label="Designation" value={formatDesignation(userData.designation)} />
                  )}
                  {userData.role === 'student' && (
                    <DetailItem icon={<Hash size={20} />} label="Registration No." value={userData.regno} />
                  )}
                  {(userData.role === 'faculty' || userData.role === 'admin') && (
                      <DetailItem icon={<Hash size={20} />} label="Staff ID" value={userData.staffId} />
                  )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handlePasswordReset}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
              </Button>
            </DialogFooter>
          </>
        ) : (
             <p className="py-4 text-center text-muted-foreground">Could not load user data.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
