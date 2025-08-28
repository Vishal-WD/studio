
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, KeyRound, ShieldCheck, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteUserDialog } from '@/components/dashboard/delete-user-dialog';
import { EditUserDialog } from '@/components/dashboard/edit-user-dialog';
import { useToast } from '@/hooks/use-toast';
import { CreateUserDialog } from '@/components/dashboard/create-user-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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

        const updatePayload: any = {};
        if (updatedData.username) {
            updatePayload.authorName = updatedData.username;
        }

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

        const eventsQuery = query(collection(db, 'events'), where('authorId', '==', selectedUser.uid));
        const eventsSnapshot = await getDocs(eventsQuery);
        eventsSnapshot.forEach(eventDoc => {
            if(updatedData.username) {
              batch.update(eventDoc.ref, { authorName: updatedData.username });
            }
        });

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
        fetchUsers();
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

        const deleteStorageFile = async (fileUrl: string | undefined) => {
            if (!fileUrl) return;
            try {
                if (fileUrl.startsWith('data:')) {
                    return; 
                }
                const fileRef = ref(storage, fileUrl);
                await deleteObject(fileRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Error deleting file from storage:", error);
                }
            }
        };

        const announcementsQuery = query(collection(db, 'announcements'), where('authorId', '==', uid));
        const announcementsSnapshot = await getDocs(announcementsQuery);
        for (const announcementDoc of announcementsSnapshot.docs) {
            await deleteStorageFile(announcementDoc.data().fileUrl);
            batch.delete(announcementDoc.ref);
        }

        const eventsQuery = query(collection(db, 'events'), where('authorId', '==', uid));
        const eventsSnapshot = await getDocs(eventsQuery);
        for (const eventDoc of eventsSnapshot.docs) {
            await deleteStorageFile(eventDoc.data().imageUrl);
            batch.delete(eventDoc.ref);
        }
        
        const resourcesQuery = query(collection(db, 'resources'), where('authorId', '==', uid));
        const resourcesSnapshot = await getDocs(resourcesQuery);
        for (const resourceDoc of resourcesSnapshot.docs) {
            await deleteStorageFile(resourceDoc.data().fileUrl);
            batch.delete(resourceDoc.ref);
        }

        const userDocRef = doc(db, 'users', uid);
        batch.delete(userDocRef);

        await batch.commit();

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
    if (!user.designation) return null;
    let display = user.designation.replace('_', ' ');
    return <p className="text-sm text-foreground capitalize">Designation: {display}</p>;
  }

  const UserActions = ({ user }: { user: User }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                <Edit /> Edit User
            </DropdownMenuItem>
             <DropdownMenuItem onSelect={() => handleEditClick(user)}>
                <ShieldCheck /> Change Role
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlePasswordReset(user.email)}>
                <KeyRound /> Send Password Reset
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDeleteClick(user)} className="text-destructive">
                <Trash2 /> Delete User
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  const UserCard = ({ user }: { user: User }) => (
    <Card className="border-primary border-2">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{user.username}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
                <UserActions user={user} />
            </div>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{user.role}</Badge>
                <p className="text-sm text-foreground">{user.department}</p>
            </div>
            {user.staffId && <p className="text-sm text-foreground">Staff ID: {user.staffId}</p>}
            {user.regno && <p className="text-sm text-foreground">Reg. No: {user.regno}</p>}
            {getDesignationDisplay(user)}
        </CardContent>
    </Card>
  );

  const UsersList = ({users, type}: {users: User[], type: 'staff' | 'student'}) => (
     <>
        <div className="md:hidden space-y-4">
            {users.length > 0 ? (
                users.map((u) => <UserCard key={u.id} user={u} />)
            ) : (
                <p className="text-center text-foreground py-4">No {type} found.</p>
            )}
        </div>
        
        <div className="hidden md:block">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        {type === 'staff' && <TableHead>Designation</TableHead>}
                        <TableHead>Department</TableHead>
                        <TableHead>{type === 'staff' ? 'Staff ID' : 'Registration No.'}</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length > 0 ? (
                    users.map((u) => (
                        <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{u.role}</Badge>
                        </TableCell>
                        {type === 'staff' && <TableCell className="capitalize">{u.designation?.replace('_', ' ') || 'N/A'}</TableCell>}
                        <TableCell>{u.department}</TableCell>
                        <TableCell>{u.staffId || u.regno}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(u)} title="Edit User">
                                    <Edit />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePasswordReset(u.email)} title="Send Password Reset">
                                    <KeyRound />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(u)} title="Delete User">
                                    <Trash2 />
                                </Button>
                           </div>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={type === 'staff' ? 7 : 6} className="text-center">
                        No {type} found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
     </>
  )


  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-10 w-full" />
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
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle />
          Create User
        </Button>
      </div>

       <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input 
              className="pl-9 w-full md:w-1/2 border-primary focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

    <Card className="shadow-md border-2 border-primary">
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b-2 border-primary rounded-none">
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-0">
            <UsersList users={staffUsers} type="staff" />
        </TabsContent>
        <TabsContent value="students" className="mt-0">
            <UsersList users={studentUsers} type="student" />
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
