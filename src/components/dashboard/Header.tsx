'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/auth/UserNav';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ user, title = 'Dashboard', onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Mobile menu button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      {/* Right section - User nav */}
      <div className="flex items-center gap-4">
        <UserNav user={user} />
      </div>
    </header>
  );
}
