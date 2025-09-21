import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size]
        )}
      />
    </div>
  );
};

interface LoadingOverlayProps {
  children?: React.ReactNode;
  className?: string;
}

const LoadingOverlay = ({ children, className }: LoadingOverlayProps) => (
  <div
    className={cn(
      'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}
  >
    <LoadingSpinner size="lg" />
    {children && (
      <p className="mt-4 text-sm text-muted-foreground">{children}</p>
    )}
  </div>
);

export { LoadingSpinner, LoadingOverlay };