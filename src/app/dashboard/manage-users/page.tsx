
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteUserDialog } from '@/components/dashboard/delete-user-dialog';
import { EditUserDialog } from '@/components/dashboard/edit-user-dialog';
import { useToast } from '@/hooks/use-toast';
import { CreateUserDialog } from '@/components/dashboard/create-user-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
  regno?: string;
  staffId?: string;
  designation?: 'dean' | 'hod';
}

export default function ManageUsersPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userData?.role !== 'admin') {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
        });
        router.push('/dashboard');
      }
    }
  }, [user, userData, authLoading, router, toast]);

  const fetchUsers = async () => {
    if (userData?.role === 'admin') {
      try {
        setLoading(true);
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch user data." });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && userData?.role === 'admin') {
      fetchUsers();
    }
  }, [authLoading, userData]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return (
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.department.toLowerCase().includes(term) ||
        (user.regno && user.regno.toLowerCase().includes(term)) ||
        (user.staffId && user.staffId.toLowerCase().includes(term))
      );
    });
  }, [searchTerm, users]);
  
  const studentUsers = useMemo(() => filteredUsers.filter(u => u.role === 'student'), [filteredUsers]);
  const staffUsers = useMemo(() => filteredUsers.filter(u => u.role === 'faculty' || u.role === 'admin'), [filteredUsers]);


  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${email} with instructions to reset their password.`,
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not send password reset email.',
      });
    }
  };
  
  const handleUserUpdate = async (updatedData: Partial<User>) => {
    if (!selectedUser) return;
    try {
        const userDocRef = doc(db, 'users', selectedUser.uid);
        await updateDoc(userDocRef, updatedData);
        
        const batch = writeBatch(db);

        // Common payload parts
        const updatePayload: any = {};
        if (updatedData.username) {
            updatePayload.authorName = updatedData.username;
        }

        // Update Notices
        const announcementsQuery = query(collection(db, 'announcements'), where('authorId', '==', selectedUser.uid));
        const announcementsSnapshot = await getDocs(announcementsQuery);
        announcementsSnapshot.forEach(announcementDoc => {
            const announcementUpdatePayload = {...updatePayload};
            if (updatedData.department) announcementUpdatePayload.authorDepartment = updatedData.department;
            if (updatedData.hasOwnProperty('designation')) { 
              announcementUpdatePayload.authorDesignation = updatedData.designation || null;
            }
            batch.update(announcementDoc.ref, announcementUpdatePayload);
        });

        // Update Events
        const eventsQuery = query(collection(db, 'events'), where('authorId', '==', selectedUser.uid));
        const eventsSnapshot = await getDocs(eventsQuery);
        eventsSnapshot.forEach(eventDoc => {
            if(updatedData.username) {
              batch.update(eventDoc.ref, { authorName: updatedData.username });
            }
        });

        // Update Resources
        const resourcesQuery = query(collection(db, 'resources'), where('authorId', '==', selectedUser.uid));
        const resourcesSnapshot = await getDocs(resourcesQuery);
        resourcesSnapshot.forEach(resourceDoc => {
            const resourceUpdatePayload: any = {};
            if (updatedData.username) resourceUpdatePayload.authorName = updatedData.username;
            if (updatedData.department) resourceUpdatePayload.department = updatedData.department;
            if (Object.keys(resourceUpdatePayload).length > 0) {
              batch.update(resourceDoc.ref, resourceUpdatePayload);
            }
        });
        
        await batch.commit();

        setEditDialogOpen(false);
        toast({ title: "Success", description: "User and all their content have been updated successfully." });
        fetchUsers(); // Refresh the user list
    } catch (error) {
        console.error("Error updating user and their content:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update user." });
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;
    try {
        const uid = selectedUser.uid;
        const batch = writeBatch(db);

        // Function to delete a file from storage if it exists
        const deleteStorageFile = async (fileUrl: string | undefined) => {
            if (!fileUrl) return;
            try {
                // For data URIs, there's nothing to delete in storage.
                if (fileUrl.startsWith('data:')) {
                    return; 
                }
                // For gs:// or https:// URLs from Firebase Storage
                const fileRef = ref(storage, fileUrl);
                await deleteObject(fileRef);
            } catch (error: any) {
                // Log and ignore errors for files that might already be deleted or don't exist.
                if (error.code !== 'storage/object-not-found') {
                    console.error("Error deleting file from storage:", error);
                }
            }
        };

        // Delete user's notices and associated files
        const announcementsQuery = query(collection(db, 'announcements'), where('authorId', '==', uid));
        const announcementsSnapshot = await getDocs(announcementsQuery);
        for (const announcementDoc of announcementsSnapshot.docs) {
            await deleteStorageFile(announcementDoc.data().fileUrl);
            batch.delete(announcementDoc.ref);
        }

        // Delete user's events and associated images
        const eventsQuery = query(collection(db, 'events'), where('authorId', '==', uid));
        const eventsSnapshot = await getDocs(eventsQuery);
        for (const eventDoc of eventsSnapshot.docs) {
            await deleteStorageFile(eventDoc.data().imageUrl);
            batch.delete(eventDoc.ref);
        }
        
        // Delete user's resources and associated files
        const resourcesQuery = query(collection(db, 'resources'), where('authorId', '==', uid));
        const resourcesSnapshot = await getDocs(resourcesQuery);
        for (const resourceDoc of resourcesSnapshot.docs) {
            await deleteStorageFile(resourceDoc.data().fileUrl);
            batch.delete(resourceDoc.ref);
        }

        // Delete the user document itself
        const userDocRef = doc(db, 'users', uid);
        batch.delete(userDocRef);

        // Commit all Firestore deletions
        await batch.commit();

        // Note: Deleting the user from Firebase Auth is a separate, more complex operation.
        // It's a destructive action that requires backend logic (like a Cloud Function) to be done safely.
        // This implementation only removes the user from the application database and their content.

        setDeleteDialogOpen(false);
        toast({ title: "Success", description: `User ${selectedUser.username} and their content have been deleted.` });
        fetchUsers();
        
    } catch (error) {
        console.error("Error deleting user and their content:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete user and their content." });
    }
  };
  
  const onUserCreated = () => {
    fetchUsers();
  };

  const getDesignationDisplay = (user: User) => {
    if (!user.designation) return 'N/A';
    let display = user.designation.replace('_', ' ');
    return <span className="capitalize">{display}</span>;
  }

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <Card className="border-2 border-primary">
          <CardHeader>
             <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (userData?.role !== 'admin') {
    return null;
  }

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Users</h1>
          <p className="text-foreground">View and manage all users in the system.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Create User
        </Button>
      </div>

       <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input 
              placeholder="Search by name, email, ID, or department..." 
              className="pl-9 w-full md:w-1/2 border-primary focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

    <Card className="shadow-md border-2 border-primary">
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-2 border-primary rounded-md">
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-0">
                <CardHeader>
                <CardTitle>Staff</CardTitle>
                <CardDescription>All faculty and admin users.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Staff ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffUsers.length > 0 ? (
                        staffUsers.map((u) => (
                            <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                                <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                            </TableCell>
                            <TableCell>{getDesignationDisplay(u)}</TableCell>
                            <TableCell>{u.department}</TableCell>
                            <TableCell>{u.staffId}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditClick(u)} title="Edit User">
                                <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditClick(u)} title="Change Role">
                                <ShieldCheck className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handlePasswordReset(u.email)} title="Send Password Reset">
                                <KeyRound className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(u)} title="Delete User">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center">
                            No staff members found.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
        </TabsContent>
        <TabsContent value="students" className="mt-0">
                <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>All student users.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Registration No.</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentUsers.length > 0 ? (
                        studentUsers.map((u) => (
                            <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.department}</TableCell>
                            <TableCell>{u.regno}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditClick(u)} title="Edit User">
                                <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleEditClick(u)} title="Change Role">
                                <ShieldCheck className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handlePasswordReset(u.email)} title="Send Password Reset">
                                <KeyRound className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(u)} title="Delete User">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                            No students found.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
    </div>
    
    <CreateUserDialog 
      isOpen={isCreateDialogOpen}
      onOpenChange={setCreateDialogOpen}
      onUserCreated={onUserCreated}
    />
    
    {selectedUser && (
      <>
        <EditUserDialog 
          isOpen={isEditDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onSave={handleUserUpdate}
        />
        <DeleteUserDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleUserDelete}
          username={selectedUser.username}
        />
      </>
    )}
    </>
  );
}

    

    
