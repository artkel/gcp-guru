'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  className
}: SwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-7',
    md: 'h-5 w-9',
    lg: 'h-6 w-11'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-3' : 'translate-x-0.5',
    md: checked ? 'translate-x-4' : 'translate-x-0.5',
    lg: checked ? 'translate-x-5' : 'translate-x-0.5'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        sizeClasses[size],
        checked
          ? 'bg-primary'
          : 'bg-gray-200 dark:bg-gray-600',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none relative inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      >
        <span
          className={cn(
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out',
            checked ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        >
          <svg className="h-2 w-2 text-gray-400" fill="none" viewBox="0 0 12 12">
            <path
              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span
          className={cn(
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out',
            checked ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          <svg className="h-2 w-2 text-primary" fill="currentColor" viewBox="0 0 12 12">
            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
          </svg>
        </span>
      </span>
    </button>
  );
}