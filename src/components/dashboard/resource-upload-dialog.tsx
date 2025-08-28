
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, FileUp, X } from 'lucide-react';
import type { Resource, ResourceType } from '@/app/dashboard/resources/page';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

interface ResourceUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingResource?: Resource | null;
}

const MAX_FILE_SIZE_BYTES = 350 * 1024; // 350KB
const MAX_BASE64_SIZE_BYTES = 1048487; // Firestore's 1MB limit for a field

const formSchema = z.object({
  type: z.enum(['academic_calendar', 'exam_schedule']),
  fileName: z.string().min(1, 'File name is required.'),
});

interface FileAttachment {
    dataUrl: string;
    name: string;
    type: string;
}

export function ResourceUploadDialog({ isOpen, onOpenChange, existingResource }: ResourceUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();
  
  const isEditing = !!existingResource;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'academic_calendar',
      fileName: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({ 
            type: existingResource?.type || 'academic_calendar',
            fileName: existingResource?.fileName || '',
        });
        setAttachment(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [existingResource, form, isOpen]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: 'destructive', title: 'Error', description: `File size must be less than 350KB.` });
        return;
      }
      form.setValue('fileName', file.name, { shouldValidate: true });

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (dataUrl.length > MAX_BASE64_SIZE_BYTES) {
          toast({ variant: 'destructive', title: 'Error', description: 'File is too large after encoding. Please select a smaller file.' });
          return;
        }
        setAttachment({ dataUrl, name: file.name, type: file.type });
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeFile = () => {
    setAttachment(null);
    form.setValue('fileName', existingResource?.fileName || ''); // Reset to original or empty
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isEditing && !attachment) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to upload.' });
        return;
    }
    if (!user || !userData) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const canManage = userData.designation === 'hod' || userData.designation === 'dean';
    if (!canManage) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to upload resources.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const resourceData: any = {
            type: values.type,
            fileName: values.fileName,
            department: userData.department,
            authorId: user.uid,
            authorName: userData.username,
            updatedAt: serverTimestamp(),
        };

        if (attachment) {
            // Only update file details if a new file is attached
            resourceData.fileUrl = attachment.dataUrl;
            resourceData.fileType = attachment.type;
        }

        if (isEditing && existingResource) {
            await updateDoc(doc(db, 'resources', existingResource.id), resourceData);
            toast({ title: 'Success', description: 'Resource updated successfully.' });
        } else {
            resourceData.createdAt = serverTimestamp();
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
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                <FormItem>
                    <Label>Resource Type</Label>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a resource type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="academic_calendar">Academic Calendar</SelectItem>
                            <SelectItem value="exam_schedule">Exam Schedule</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                    <FormItem>
                        <Label>File Name</Label>
                        <FormControl>
                            <Input {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="space-y-2">
                <Label>File {isEditing && '(Optional, to replace)'}</Label>
                <div 
                className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted"
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                <div className="text-center">
                    <FileUp className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                    {attachment ? 'File selected. Click to change.' : (isEditing ? 'Click to replace file' : 'Click to select a file')}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1">Max file size: 350KB</p>
                </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isSubmitting}/>
                {attachment ? (
                    <div className="flex items-center justify-between p-2 text-sm border rounded-md">
                        <span className="truncate">{attachment.name}</span>
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
