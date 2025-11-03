'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex md:flex-col" />

      {/* Mobile Sidebar - Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <Sidebar className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden" />
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <Header
          user={user}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
