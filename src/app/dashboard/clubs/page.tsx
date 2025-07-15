
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateClubDialog } from '@/components/dashboard/create-club-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ClubsPage() {
  const { userData, loading } = useAuth();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const handleClubCreated = () => {
    setCreateOpen(false);
    toast({
      title: "Success",
      description: "Club created successfully!",
    });
    // Here you would typically refresh the list of clubs
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Clubs</CardTitle>
                <CardDescription>Explore student clubs.</CardDescription>
            </div>
            {loading ? (
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
      <CardContent>
        <p>Clubs page content will be displayed here.</p>
      </CardContent>
    </Card>
    
    <CreateClubDialog 
        isOpen={isCreateOpen}
        onOpenChange={setCreateOpen}
        onClubCreated={handleClubCreated}
    />
    </>
  );
}
