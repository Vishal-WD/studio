"use client";

import { useState, useEffect } from "react";
import { EventFeed } from "@/components/dashboard/event-feed";
import { ClubFeed } from "@/components/dashboard/club-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreatePostDialog } from "@/components/dashboard/create-post-dialog";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
  username?: string;
  // add other user properties here if needed
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
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
                <CardDescription>Ready to share something new?</CardDescription>
              </CardHeader>
              <CardContent>
                <CreatePostDialog />
              </CardContent>
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
    </main>
  );
}
