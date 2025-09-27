'use client';

import React from 'react';
import { OverallProgress } from '@/types';

interface StackedProgressBarProps {
  progress: OverallProgress;
}

export function StackedProgressBar({ progress }: StackedProgressBarProps) {
  const total = progress.total_questions;

  if (total === 0) {
    return (
      <div className="w-full">
        <div className="h-8 bg-secondary rounded-lg flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No questions available</span>
        </div>
      </div>
    );
  }

  // Calculate percentages
  const mistakesPercentage = (progress.mistakes_count / total) * 100;
  const learningPercentage = (progress.learning_count / total) * 100;
  const masteredPercentage = (progress.mastered_count / total) * 100;
  const perfectedPercentage = (progress.perfected_count / total) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Progress Bar */}
      <div className="h-8 bg-secondary rounded-lg overflow-hidden flex">
        {/* Mistakes - Red - Left */}
        {mistakesPercentage > 0 && (
          <div
            className="bg-destructive flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${mistakesPercentage}%` }}
          >
            {mistakesPercentage >= 8 && `${progress.mistakes_count}`}
          </div>
        )}

        {/* Learning - Grey - Middle Left */}
        {learningPercentage > 0 && (
          <div
            className="bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium"
            style={{ width: `${learningPercentage}%` }}
          >
            {learningPercentage >= 8 && `${progress.learning_count}`}
          </div>
        )}

        {/* Mastered - Green - Middle Right */}
        {masteredPercentage > 0 && (
          <div
            className="bg-success flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${masteredPercentage}%` }}
          >
            {masteredPercentage >= 8 && `${progress.mastered_count}`}
          </div>
        )}

        {/* Perfected - Purple - Right */}
        {perfectedPercentage > 0 && (
          <div
            className="bg-purple-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${perfectedPercentage}%` }}
          >
            {perfectedPercentage >= 8 && `${progress.perfected_count}`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span className="text-muted-foreground">Mistakes ({progress.mistakes_count})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted rounded"></div>
            <span className="text-muted-foreground">Learning ({progress.learning_count})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span className="text-muted-foreground">Mastered ({progress.mastered_count})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-muted-foreground">Perfected ({progress.perfected_count})</span>
          </div>
        </div>
        <div className="text-muted-foreground">
          Total: {total} questions
        </div>
      </div>

      {/* Percentage Summary */}
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          Mastery Rate: {((masteredPercentage + perfectedPercentage)).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}