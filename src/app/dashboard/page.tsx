
"use client";

import { LatestEventsFeed } from "@/components/dashboard/latest-events-feed";
import { LatestAnnouncementsFeed } from "@/components/dashboard/latest-announcements-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { userData, loading } = useAuth();

  return (
    <div className="space-y-8">
      <Card className="shadow-md border-2 border-primary">
        <CardHeader>
          <CardTitle className="font-headline">
            {loading ? "Loading..." : `Welcome, ${userData?.username || "User"}!`}
          </CardTitle>
        </CardHeader>
      </Card>
      
      <div className="space-y-8">
          <LatestEventsFeed />
          <LatestAnnouncementsFeed />
      </div>
    </div>
  );
}
