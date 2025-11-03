'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, Settings, Home } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/courses',
    icon: Home,
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn('w-64 border-r bg-muted/40', className)}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/courses" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Course Planner</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Could add version, help, etc. */}
      <div className="absolute bottom-0 w-64 border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Course Planner v0.1.0</p>
          <p className="mt-1">AI-Powered Course Development</p>
        </div>
      </div>
    </aside>
  );
}
