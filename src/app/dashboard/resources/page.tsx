
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, Edit, Trash2, ExternalLink } from 'lucide-react';
import { ResourceUploadDialog } from '@/components/dashboard/resource-upload-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog';
import Link from 'next/link';
import { QuickLinkDialog } from '@/components/dashboard/quicklink-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export interface QuickLink {
    id: string;
    title: string;
    url: string;
    order: number;
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
        <div className="text-center text-foreground py-12">
            <p>No {typeName} documents have been uploaded yet.</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredResources.map(resource => (
        <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50">
          <div>
            <a 
              href={resource.fileUrl} 
              download={resource.fileName}
              className="font-medium hover:underline"
            >
              {resource.fileName}
            </a>
            <p className="text-sm text-foreground">
              {resource.createdAt ? `${formatDistanceToNow(new Date(resource.createdAt.seconds * 1000), { addSuffix: true })} by ${resource.authorName}` : `just now by ${resource.authorName}`}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
             <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <a href={resource.fileUrl} download={resource.fileName}>
                <Download className="h-4 w-4" />
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
        </div>
      ))}
    </div>
  );
};


export default function ResourcesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Resource Dialogs
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isResourceDeleteOpen, setResourceDeleteOpen] = useState(false);

  // State for QuickLink Dialogs
  const [isQuickLinkOpen, setQuickLinkOpen] = useState(false);
  const [editingQuickLink, setEditingQuickLink] = useState<QuickLink | null>(null);
  const [deletingQuickLink, setDeletingQuickLink] = useState<QuickLink | null>(null);
  const [isQuickLinkDeleteOpen, setQuickLinkDeleteOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);

    const resourcesQuery = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const quickLinksQuery = query(collection(db, 'quicklinks'), orderBy('order', 'asc'));

    const unsubResources = onSnapshot(resourcesQuery, (querySnapshot) => {
      const resourcesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setAllResources(resourcesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resources:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch resources." });
      setLoading(false);
    });

    const unsubQuickLinks = onSnapshot(quickLinksQuery, (querySnapshot) => {
      const linksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickLink));
      setQuickLinks(linksData);
    }, (error) => {
      console.error("Error fetching quick links:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch quick links." });
    });

    return () => {
      unsubResources();
      unsubQuickLinks();
    };
  }, [authLoading, toast]);


  const departmentResources = useMemo(() => {
    if (!userData?.department) return [];
    return allResources.filter(r => r.department === userData.department);
  }, [allResources, userData]);

  const canManage = useMemo(() => {
    return userData?.designation === 'hod' || userData?.designation === 'dean';
  }, [userData]);
  
  const isAdmin = userData?.role === 'admin';

  // Resource handlers
  const handleAddResourceClick = () => {
    setEditingResource(null);
    setUploadOpen(true);
  };
  
  const handleEditResourceClick = (resource: Resource) => {
    setEditingResource(resource);
    setUploadOpen(true);
  };
  
  const handleDeleteResourceClick = (resource: Resource) => {
    setDeletingResource(resource);
    setResourceDeleteOpen(true);
  };
  
  const handleDeleteResourceConfirm = async () => {
    if (!deletingResource) return;
    try {
        await deleteDoc(doc(db, 'resources', deletingResource.id));
        toast({ title: 'Success', description: 'Resource deleted successfully.' });
    } catch (error) {
        console.error("Error deleting resource:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete resource.' });
    } finally {
        setResourceDeleteOpen(false);
        setDeletingResource(null);
    }
  };

  // QuickLink handlers
  const handleAddQuickLinkClick = () => {
    setEditingQuickLink(null);
    setQuickLinkOpen(true);
  };

  const handleEditQuickLinkClick = (link: QuickLink) => {
    setEditingQuickLink(link);
    setQuickLinkOpen(true);
  };

  const handleDeleteQuickLinkClick = (link: QuickLink) => {
    setDeletingQuickLink(link);
    setQuickLinkDeleteOpen(true);
  };

  const handleDeleteQuickLinkConfirm = async () => {
    if (!deletingQuickLink) return;
    try {
        await deleteDoc(doc(db, 'quicklinks', deletingQuickLink.id));
        toast({ title: 'Success', description: 'Quick Link deleted successfully.' });
    } catch (error) {
        console.error("Error deleting quick link:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete quick link.' });
    } finally {
        setQuickLinkDeleteOpen(false);
        setDeletingQuickLink(null);
    }
  };


  return (
    <>
    <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Resources</h1>
            <p className="text-foreground">Find important documents and quick links.</p>
        </div>

        <Card className="border-2 border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                    <CardDescription>Frequently used external links.</CardDescription>
                </div>
                {isAdmin && (
                    <Button variant="outline" size="sm" onClick={handleAddQuickLinkClick}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                {quickLinks.length > 0 ? quickLinks.map(link => (
                    <div key={link.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border">
                        <Link 
                            href={link.url}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-3 flex-grow"
                        >
                            <ExternalLink className="h-5 w-5 text-primary" />
                            <p className="font-medium">{link.title}</p>
                        </Link>
                        {isAdmin && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditQuickLinkClick(link)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteQuickLinkClick(link)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-center text-foreground py-4">No quick links have been added yet.</p>
                )}
                </div>
            </CardContent>
        </Card>
      
        <Card className="border-2 border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Department Resources</CardTitle>
                    <CardDescription>Documents specific to your department.</CardDescription>
                </div>
                 {canManage && (
                    <Button onClick={handleAddResourceClick}>
                        <PlusCircle className="mr-2" />
                        Add Resource
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="academic_calendar">
                    <TabsList className="grid w-full grid-cols-2 bg-muted">
                        <TabsTrigger value="academic_calendar">Academic Calendar</TabsTrigger>
                        <TabsTrigger value="exam_schedule">Exam Schedules</TabsTrigger>
                    </TabsList>
                    <TabsContent value="academic_calendar" className="pt-4">
                        {loading || authLoading ? <Skeleton className="h-24 w-full" /> : 
                            <ResourceList 
                                resources={departmentResources} 
                                type="academic_calendar" 
                                canManage={canManage}
                                onEdit={handleEditResourceClick}
                                onDelete={handleDeleteResourceClick}
                            />
                        }
                    </TabsContent>
                    <TabsContent value="exam_schedule" className="pt-4">
                        {loading || authLoading ? <Skeleton className="h-24 w-full" /> : 
                            <ResourceList 
                                resources={departmentResources} 
                                type="exam_schedule" 
                                canManage={canManage}
                                onEdit={handleEditResourceClick}
                                onDelete={handleDeleteResourceClick}
                            />
                        }
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>

    <ResourceUploadDialog 
        isOpen={isUploadOpen}
        onOpenChange={setUploadOpen}
        existingResource={editingResource}
    />
    
    <DeleteConfirmationDialog 
        isOpen={isResourceDeleteOpen}
        onOpenChange={setResourceDeleteOpen}
        onConfirm={handleDeleteResourceConfirm}
        itemType="resource"
    />

    <QuickLinkDialog
        isOpen={isQuickLinkOpen}
        onOpenChange={setQuickLinkOpen}
        existingLink={editingQuickLink}
    />
    
    <DeleteConfirmationDialog 
        isOpen={isQuickLinkDeleteOpen}
        onOpenChange={setQuickLinkDeleteOpen}
        onConfirm={handleDeleteQuickLinkConfirm}
        itemType="link"
        itemName={deletingQuickLink?.title}
    />
    </>
  );
}

