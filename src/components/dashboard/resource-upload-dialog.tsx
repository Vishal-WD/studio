
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, FileUp, X } from 'lucide-react';
import type { Resource, ResourceType } from '@/app/dashboard/resources/page';

interface ResourceUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingResource?: Resource | null;
}

const formSchema = z.object({
  type: z.enum(['academic_calendar', 'exam_schedule']),
  file: z.instanceof(File).optional(),
});

export function ResourceUploadDialog({ isOpen, onOpenChange, existingResource }: ResourceUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();
  
  const isEditing = !!existingResource;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: existingResource?.type || 'academic_calendar',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        if (existingResource) {
          form.reset({ type: existingResource.type });
        } else {
          form.reset({ type: 'academic_calendar' });
        }
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [existingResource, form, isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // You might want to add file size validation here
      setSelectedFile(file);
    }
  };
  
  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isEditing && !selectedFile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to upload.' });
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
        // Server-side security check before upload
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            throw new Error("User data not found.");
        }

        const serverUserData = userDocSnap.data();
        const canManage = serverUserData.designation === 'hod' || serverUserData.designation === 'dean';
        const department = serverUserData.department;

        if (!canManage || !department) {
             throw new Error("You do not have permission to upload resources.");
        }

        let fileUrl = existingResource?.fileUrl || '';
        let filePath = existingResource?.filePath || '';
        let fileName = existingResource?.fileName || '';

        // If a new file is selected, upload it
        if (selectedFile) {
            // If editing, delete old file from storage first
            if (isEditing && existingResource.filePath) {
                const oldFileRef = ref(storage, existingResource.filePath);
                try {
                    await deleteObject(oldFileRef);
                } catch (error: any) {
                    // Ignore "object not found" errors, as it might have been deleted already
                    if (error.code !== 'storage/object-not-found') {
                        console.warn("Could not delete old file, it may not exist:", error);
                    }
                }
            }

            filePath = `resources/${department}/${values.type}/${Date.now()}_${selectedFile.name}`;
            const fileRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(fileRef, selectedFile);
            fileUrl = await getDownloadURL(uploadResult.ref);
            fileName = selectedFile.name;
        }

        const resourceData: any = {
            fileName,
            fileUrl,
            filePath,
            type: values.type,
            department: department,
            authorId: user.uid,
            authorName: serverUserData.username,
            createdAt: existingResource?.createdAt ? existingResource.createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        if (isEditing && existingResource) {
            await updateDoc(doc(db, 'resources', existingResource.id), resourceData);
            toast({ title: 'Success', description: 'Resource updated successfully.' });
        } else {
            await addDoc(collection(db, 'resources'), resourceData);
            toast({ title: 'Success', description: 'Resource uploaded successfully.' });
        }

        onOpenChange(false);

    } catch (error: any) {
        console.error("Error saving resource:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not save the resource. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Resource' : 'Upload a New Resource'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the resource type or replace the file.' : 'Select a file and choose its type to upload.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic_calendar">Academic Calendar</SelectItem>
                    <SelectItem value="exam_schedule">Exam Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          
          <div className="space-y-2">
            <Label>File</Label>
            <div 
              className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <FileUp className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedFile ? 'File selected. Click to change.' : (isEditing ? 'Click to replace file' : 'Click to select a file')}
                </p>
              </div>
            </div>
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isSubmitting}/>
             {selectedFile ? (
                <div className="flex items-center justify-between p-2 text-sm border rounded-md">
                    <span className="truncate">{selectedFile.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile} disabled={isSubmitting}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
             ) : (
                isEditing && <p className="text-sm text-muted-foreground">Current file: {existingResource.fileName}</p>
             )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Uploading...'}
                </>
              ) : (isEditing ? 'Save Changes' : 'Upload')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
