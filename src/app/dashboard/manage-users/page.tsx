'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
  regno?: string;
  staffId?: string;
}

export default function ManageUsersPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || userData?.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    async function fetchUsers() {
      if (userData?.role === 'admin') {
        try {
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          const usersList = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as User[];
          setUsers(usersList);
        } catch (error) {
          console.error("Error fetching users: ", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (!authLoading && userData?.role === 'admin') {
      fetchUsers();
    }
  }, [authLoading, userData]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => {
      const term = searchTerm.toLowerCase();
      return (
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.department.toLowerCase().includes(term) ||
        (user.regno && user.regno.toLowerCase().includes(term)) ||
        (user.staffId && user.staffId.toLowerCase().includes(term))
      );
    });
  }, [searchTerm, users]);

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <Card>
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
    return null; // or a dedicated "Access Denied" component
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Users</h1>
          <p className="text-muted-foreground">Create, view, edit, and delete user accounts.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Create User
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
          <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, ID, or department..." 
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>ID (Reg/Staff)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>{u.department}</TableCell>
                      <TableCell>{u.role === 'student' ? u.regno : u.staffId}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
