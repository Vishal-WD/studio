
'use client';

import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

const BottomNavBar = () => {
  const pathname = usePathname();
  const { userData, loading } = useAuth();

  // Don't render until we know the user's role to prevent hydration mismatch
  if (loading) {
    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
            <div className="grid h-full max-w-lg mx-auto grid-cols-4">
                {/* You can add skeleton loaders here if you want */}
            </div>
        </div>
    );
  }

  const allMenuItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/dashboard/events', icon: <Calendar />, label: 'Events' },
    { href: '/dashboard/clubs', icon: <Users />, label: 'Clubs' },
    { href: '/dashboard/posts', icon: <MessageSquare />, label: 'Posts' },
    ...(userData?.role === 'admin' ? [{ href: '/dashboard/manage-users', icon: <ShieldCheck />, label: 'Users' }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div 
        className="grid h-full max-w-lg mx-auto font-medium"
        style={{ gridTemplateColumns: `repeat(${allMenuItems.length}, minmax(0, 1fr))` }}
      >
        {allMenuItems.map(item => (
           <Link key={item.href} href={item.href} className={`inline-flex flex-col items-center justify-center px-5 hover:bg-muted group ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>
            {item.icon}
            <span className="text-xs">{item.label}</span>
        </Link>
        ))}
      </div>
    </div>
  );
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }
  
  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 mb-16">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
