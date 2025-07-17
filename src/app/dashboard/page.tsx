
"use client";

import { LatestEventsFeed } from "@/components/dashboard/latest-events-feed";
import { LatestPostsFeed } from "@/components/dashboard/latest-posts-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
          <LatestPostsFeed />
      </div>
    </div>
  );
}
