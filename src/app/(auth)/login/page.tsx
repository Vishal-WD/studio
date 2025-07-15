
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    // Show a loader or blank screen while checking auth state or redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Skeleton className="h-[450px] w-full max-w-md" />
      </div>
    );
  }

  return <LoginForm />;
}
