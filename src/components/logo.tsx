import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Flame className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold font-headline text-primary">CampusConnect</h1>
    </div>
  );
}
