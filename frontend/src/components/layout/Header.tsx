'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary">GCP Guru</h1>
          <span className="text-xs text-muted-foreground">Professional Cloud Architect Prep</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}