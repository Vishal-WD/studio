'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
  { href: '/dashboard/events', icon: <Calendar />, label: 'Events' },
  { href: '/dashboard/clubs', icon: <Users />, label: 'Clubs' },
  { href: '/dashboard/posts', icon: <MessageSquare />, label: 'Posts' },
];

const adminMenuItems = [
  {
    href: '/dashboard/manage-users',
    icon: <ShieldCheck />,
    label: 'Manage Users',
  },
];

const BottomNavBar = () => {
  const pathname = usePathname();
  const { userData } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
         <Link href="/dashboard" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutDashboard />
            <span className="text-xs">Dashboard</span>
        </Link>
         <Link href="/dashboard/events" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === '/dashboard/events' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Calendar />
            <span className="text-xs">Events</span>
        </Link>
        <Link href="/dashboard/clubs" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === '/dashboard/clubs' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Users />
            <span className="text-xs">Clubs</span>
        </Link>
        <Link href="/dashboard/posts" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === '/dashboard/posts' ? 'text-primary' : 'text-muted-foreground'}`}>
            <MessageSquare />
            <span className="text-xs">Posts</span>
        </Link>
        {userData?.role === 'admin' && (
           <Link href="/dashboard/manage-users" className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === '/dashboard/manage-users' ? 'text-primary' : 'text-muted-foreground'}`}>
                <ShieldCheck />
                <span className="text-xs">Users</span>
            </Link>
        )}
      </div>
    </div>
  );
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userData } = useAuth();
  const isMobile = useIsMobile();


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {userData?.role === 'admin' &&
              adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="#">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/login">
                  <LogOut />
                  Logout
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 mb-16 md:mb-0">
          {children}
        </main>
        {isMobile && <BottomNavBar />}
      </SidebarInset>
    </SidebarProvider>
  );
}
