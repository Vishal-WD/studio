
"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ProfileDialog } from "./profile-dialog";
import { Logo } from '../logo';
import { collection, query, onSnapshot, orderBy, limit, where, serverTimestamp, updateDoc, doc, Timestamp } from 'firebase/firestore';
import type { Post } from '@/components/dashboard/post-item';
import type { Event } from '@/components/dashboard/event-item';
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Calendar } from "lucide-react";

type Notification = (Post & { type: 'post' }) | (Event & { type: 'event' });

export function DashboardHeader() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!user || !userData) {
        setLoadingNotifications(false);
        return;
    };

    setLoadingNotifications(true);

    const notificationsLastClearedAt = userData.notificationsLastClearedAt as Timestamp | undefined;

    const basePostsQuery = query(
        collection(db, 'posts'), 
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    const postsQuery = notificationsLastClearedAt 
        ? query(basePostsQuery, where('createdAt', '>', notificationsLastClearedAt))
        : basePostsQuery;

    const baseEventsQuery = query(
        collection(db, 'events'), 
        orderBy('createdAt', 'desc'),
        limit(10)
    );
     const eventsQuery = notificationsLastClearedAt 
        ? query(baseEventsQuery, where('createdAt', '>', notificationsLastClearedAt))
        : baseEventsQuery;


    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs
          .map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as Notification))
          .filter(post => post.createdAt); // Ensure createdAt exists
        setNotifications(prev => {
            const otherNotifications = prev.filter(n => n.type !== 'post');
            const all = [...otherNotifications, ...postsData].sort((a,b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.seconds - a.createdAt.seconds;
            });
            return all;
        });
        setLoadingNotifications(false);
    }, (error) => {
        console.error("Error fetching post notifications:", error);
        setLoadingNotifications(false);
    });

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs
          .map(doc => ({ id: doc.id, type: 'event', ...doc.data() } as Notification))
          .filter(event => event.createdAt); // Ensure createdAt exists
        setNotifications(prev => {
            const otherNotifications = prev.filter(n => n.type !== 'event');
            const all = [...otherNotifications, ...eventsData].sort((a,b) => {
              if (!a.createdAt || !b.createdAt) return 0;
              return b.createdAt.seconds - a.createdAt.seconds
            });
            return all;
        });
        setLoadingNotifications(false);
    }, (error) => {
        console.error("Error fetching event notifications:", error);
        setLoadingNotifications(false);
    });

    return () => {
        unsubscribePosts();
        unsubscribeEvents();
    };

  }, [user, userData]);

  const filteredNotifications = useMemo(() => {
    if (authLoading || !userData) return [];
    
    return notifications.filter(notification => {
        if (!notification.createdAt) return false; // Extra safety filter

        if (notification.type === 'event') {
            return true; // Everyone sees event notifications
        }
        if (notification.type === 'post') {
            // Dean sees all posts
            if (userData.designation === 'dean') return true;
            // Admins, faculty, students see posts from their own department
            if (userData.department) {
                return notification.authorDepartment === userData.department;
            }
        }
        return false;
    }).slice(0, 5);

  }, [notifications, userData, authLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out successfully!",
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred while logging out.",
      });
    }
  };
  
  const handleClearNotifications = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await updateDoc(userDocRef, {
            notificationsLastClearedAt: serverTimestamp()
        });
        toast({
            title: "Notifications Cleared",
            description: "Your notification feed is now empty.",
        });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear notifications. Please try again.",
        });
    }
  };


  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-primary px-4 md:px-6 text-primary-foreground">
      <div className="flex-1">
        <Logo />
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
              <Bell className="h-5 w-5" />
              {!loadingNotifications && filteredNotifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loadingNotifications ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                    <DropdownMenuItem key={`${notification.type}-${notification.id}`} asChild>
                         <Link href={notification.type === 'post' ? `/dashboard/posts` : `/dashboard/events/${notification.id}`} className="block w-full cursor-pointer">
                            <div className="flex items-start gap-3">
                                {notification.type === 'post' ? <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" /> : <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />}
                                <div>
                                    <p className="text-sm font-medium line-clamp-1">
                                        {notification.type === 'post' ? 'New Post' : notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.type === 'post' ? notification.content : `From ${notification.authorName}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground/80 mt-1">
                                        {formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))
            ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            )}
            {!loadingNotifications && filteredNotifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onSelect={(e) => { e.preventDefault(); handleClearNotifications(); }} 
                  className="flex items-center justify-center text-xs text-muted-foreground cursor-pointer"
                >
                  Clear All Notifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="font-bold">{userData?.username}</div>
              <div className="text-xs text-muted-foreground font-normal">{userData?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)} className="cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    <ProfileDialog open={isProfileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
