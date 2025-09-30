'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-primary">GCP Guru</h1>
            <Badge variant="beta" className="hidden xs:inline-flex">Beta</Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">Professional Cloud Architect Prep</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-[120px] sm:max-w-none">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}