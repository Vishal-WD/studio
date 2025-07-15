"use client";

import { EventFeed } from "@/components/dashboard/event-feed";
import { ClubFeed } from "@/components/dashboard/club-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { userData, loading } = useAuth();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <EventFeed />
        <ClubFeed />
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">
                {loading ? "Loading..." : `Welcome, ${userData?.username || "User"}!`}
              </CardTitle>
              <CardDescription>Here's what's happening on campus today.</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="shadow-md">
             <CardHeader>
              <CardTitle className="font-headline">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2 text-sm text-primary">
               <a href="#" className="hover:underline">Academic Calendar</a>
               <a href="#" className="hover:underline">Library Portal</a>
               <a href="#" className="hover:underline">Exam Schedules</a>
               <a href="#" className="hover:underline">Campus Map</a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
