
"use client";

import { useState } from "react";
import { UserCircle } from "lucide-react";
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
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ProfileDialog } from "./profile-dialog";
import { Logo } from '../logo';

export function DashboardHeader() {
  const { userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProfileOpen, setProfileOpen] = useState(false);

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
  
  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-primary px-4 md:px-6 text-primary-foreground">
      <div className="flex-1">
        <Logo />
      </div>
      
      <div className="flex items-center gap-2">
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
              <div className="text-xs text-foreground font-normal">{userData?.email}</div>
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
