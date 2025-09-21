'use client';

import React from 'react';
import { Target, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface MenuButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'primary';
  onClick: () => void;
}

function MenuButton({ icon, title, description, variant = 'default', onClick }: MenuButtonProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        variant === 'primary' && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn(
            'rounded-lg p-3',
            variant === 'primary'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}>
            {icon}
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StartScreen() {
  const { setCurrentScreen } = useAppStore();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            GCP Professional Cloud Architect
          </h2>
          <p className="text-muted-foreground">
            Master Google Cloud concepts with interactive flashcards and AI-powered explanations
          </p>
        </div>

        <div className="space-y-4">
          <MenuButton
            icon={<Target className="h-6 w-6" />}
            title="Start Training Session"
            description="Practice questions and improve your skills with adaptive learning"
            variant="primary"
            onClick={() => setCurrentScreen('domain-selection')}
          />

          <MenuButton
            icon={<BarChart3 className="h-6 w-6" />}
            title="My Progress"
            description="View detailed analytics and track your performance"
            onClick={() => setCurrentScreen('progress')}
          />

          <MenuButton
            icon={<BookOpen className="h-6 w-6" />}
            title="Browse Questions"
            description="Search and manage all questions in your study set"
            onClick={() => setCurrentScreen('browse')}
          />
        </div>
      </div>
    </div>
  );
}