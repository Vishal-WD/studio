
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClubsPage() {
  const { userData, loading } = useAuth();

  return (
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
                    <Button>
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
  );
}
