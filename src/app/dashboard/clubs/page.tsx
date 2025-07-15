
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateClubDialog } from '@/components/dashboard/create-club-dialog';
import { EditClubDialog } from '@/components/dashboard/edit-club-dialog';
import { CreateEventDialog } from '@/components/dashboard/create-event-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


export interface Club {
    id: string;
    name: string;
    description: string;
    profilePicUrl?: string;
    officials: {
        inchargeStaffId: string;
        presidentRegno: string;
        vicePresidentRegno: string;
        secretaryRegno: string;
    };
    createdAt: any;
}


const ClubItem = ({ club, onEdit, onPostEvent, canManage }: { club: Club, onEdit: (club: Club) => void, onPostEvent: (club: Club) => void, canManage: boolean }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                 <Avatar className="h-16 w-16 border">
                    <AvatarImage src={club.profilePicUrl} alt={club.name} />
                    <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{club.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{club.description}</p>
            </CardContent>
            {canManage && (
                 <CardFooter className="border-t pt-4">
                    <div className="flex w-full justify-end gap-2">
                         <Button variant="outline" size="sm" onClick={() => onPostEvent(club)}>
                            <Megaphone className="mr-2 h-4 w-4" />
                            Post Event
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onEdit(club)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
};


export default function ClubsPage() {
  const { userData, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const [isCreateOpen, setCreateOpen] = useState(false);
  
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isEventOpen, setEventOpen] = useState(false);


  useEffect(() => {
    const q = query(collection(db, 'clubs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clubsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setClubs(clubsData);
        setLoadingClubs(false);
    }, (error) => {
        console.error("Error fetching clubs:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch clubs."});
        setLoadingClubs(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const handleClubCreated = () => {
    setCreateOpen(false);
    toast({
      title: "Success",
      description: "Club created successfully!",
    });
  }
  
  const handleClubUpdated = () => {
    setEditOpen(false);
    toast({
      title: "Success",
      description: "Club details updated successfully!",
    });
  }
  
  const handleEventCreated = () => {
    setEventOpen(false);
    toast({
      title: "Success",
      description: "Event posted successfully!",
    });
  }

  const handleEditClick = (club: Club) => {
    setSelectedClub(club);
    setEditOpen(true);
  }

  const handlePostEventClick = (club: Club) => {
    setSelectedClub(club);
    setEventOpen(true);
  }

  const canUserManageClub = (club: Club) => {
    if (authLoading || !userData) return false;
    if (userData.role === 'admin') return true;
    if (userData.role === 'faculty' && userData.staffId === club.officials.inchargeStaffId) return true;
    return false;
  }

  return (
    <>
    <div className="space-y-6">
       <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Clubs</CardTitle>
                        <CardDescription>Explore student clubs and their activities.</CardDescription>
                    </div>
                    {authLoading ? (
                        <Skeleton className="h-10 w-32" />
                    ) : (
                        userData?.role === 'admin' && (
                            <Button onClick={() => setCreateOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Club
                            </Button>
                        )
                    )}
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {loadingClubs ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : clubs.length > 0 ? (
                clubs.map(club => (
                    <ClubItem 
                        key={club.id} 
                        club={club}
                        onEdit={handleEditClick}
                        onPostEvent={handlePostEventClick}
                        canManage={canUserManageClub(club)}
                    />
                ))
            ) : (
                <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No clubs have been created yet.
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
    
    <CreateClubDialog 
        isOpen={isCreateOpen}
        onOpenChange={setCreateOpen}
        onClubCreated={handleClubCreated}
    />

    {selectedClub && (
        <>
            <EditClubDialog
                isOpen={isEditOpen}
                onOpenChange={setEditOpen}
                club={selectedClub}
                onClubUpdated={handleClubUpdated}
            />
            <CreateEventDialog
                isOpen={isEventOpen}
                onOpenChange={setEventOpen}
                club={selectedClub}
                onEventCreated={handleEventCreated}
            />
        </>
    )}
    </>
  );
}
