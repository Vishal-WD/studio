
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, Edit, Trash2 } from 'lucide-react';
import { ResourceUploadDialog } from '@/components/dashboard/resource-upload-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog';

export type ResourceType = 'academic_calendar' | 'exam_schedule';

export interface Resource {
  id: string;
  fileName: string;
  fileUrl: string; // This will be a Base64 data URI
  fileType: string;
  type: ResourceType;
  department: string;
  authorId: string;
  authorName: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const ResourceList = ({ 
    resources, 
    type, 
    canManage, 
    onEdit, 
    onDelete 
}: { 
    resources: Resource[], 
    type: ResourceType, 
    canManage: boolean, 
    onEdit: (resource: Resource) => void,
    onDelete: (resource: Resource) => void 
}) => {
  
  const filteredResources = resources.filter(r => r.type === type);
  const typeName = type.replace('_', ' ');

  if (filteredResources.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No {typeName} documents have been uploaded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredResources.map(resource => (
        <Card key={resource.id} className="flex items-center justify-between p-4">
          <div>
            <a 
              href={resource.fileUrl} 
              download={resource.fileName}
              className="font-medium hover:underline"
            >
              {resource.fileName}
            </a>
            <p className="text-sm text-muted-foreground">
              Uploaded {resource.createdAt ? formatDistanceToNow(new Date(resource.createdAt.seconds * 1000), { addSuffix: true }) : 'just now'} by {resource.authorName}
            </p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" asChild>
              <a href={resource.fileUrl} download={resource.fileName}>
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
            {canManage && (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onEdit(resource)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => onDelete(resource)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};


export default function ResourcesPage() {
  const { userData, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!userData?.department) {
        setLoading(false);
        return;
    };

    const q = query(
      collection(db, 'resources'), 
      where('department', '==', userData.department),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const resourcesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(resourcesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resources:", error);
      toast({ variant: 'destructive', title: "Permissions Error", description: "Could not fetch resources. You may need to have an index created in Firestore."})
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData, authLoading, toast]);

  const canManage = useMemo(() => {
    return userData?.designation === 'hod' || userData?.designation === 'dean';
  }, [userData]);
  
  const handleAddClick = () => {
    setEditingResource(null);
    setUploadOpen(true);
  };
  
  const handleEditClick = (resource: Resource) => {
    setEditingResource(resource);
    setUploadOpen(true);
  };
  
  const handleDeleteClick = (resource: Resource) => {
    setDeletingResource(resource);
    setDeleteOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deletingResource) return;

    try {
        // Only delete Firestore document
        await deleteDoc(doc(db, 'resources', deletingResource.id));
        
        toast({ title: 'Success', description: 'Resource deleted successfully.' });
    } catch (error) {
        console.error("Error deleting resource:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete resource.' });
    } finally {
        setDeleteOpen(false);
        setDeletingResource(null);
    }
  };


  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Department Resources</h1>
          <p className="text-muted-foreground">Find important documents like calendars and schedules.</p>
        </div>
        {canManage && (
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2" />
            Add Resource
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="academic_calendar">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="academic_calendar">Academic Calendar</TabsTrigger>
          <TabsTrigger value="exam_schedule">Exam Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="academic_calendar" className="mt-4">
            {loading || authLoading ? <Skeleton className="h-40 w-full" /> : 
                <ResourceList 
                    resources={resources} 
                    type="academic_calendar" 
                    canManage={canManage}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
            }
        </TabsContent>
        <TabsContent value="exam_schedule" className="mt-4">
             {loading || authLoading ? <Skeleton className="h-40 w-full" /> : 
                <ResourceList 
                    resources={resources} 
                    type="exam_schedule" 
                    canManage={canManage}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
            }
        </TabsContent>
      </Tabs>
    </div>

    <ResourceUploadDialog 
        isOpen={isUploadOpen}
        onOpenChange={setUploadOpen}
        existingResource={editingResource}
    />
    
    <DeleteConfirmationDialog 
        isOpen={isDeleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        itemName={deletingResource?.fileName}
        itemType="resource"
    />
    </>
  );
}
