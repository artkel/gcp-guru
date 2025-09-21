'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAppStore } from '@/lib/store';
import { useAvailableTags, useStartNewSession } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export function DomainSelectionScreen() {
  const {
    setCurrentScreen,
    setSelectedDomains,
    selectedDomains,
    setIsLoading,
    isLoading,
    resetSessionStats,
    startSessionTimer,
  } = useAppStore();

  const { data: tagsData, isLoading: tagsLoading } = useAvailableTags();
  const startNewSession = useStartNewSession();

  const [localSelectedDomains, setLocalSelectedDomains] = useState<string[]>([]);
  const [allDomainsSelected, setAllDomainsSelected] = useState(false);

  useEffect(() => {
    if (selectedDomains) {
      setLocalSelectedDomains(selectedDomains);
    }
  }, [selectedDomains]);

  const handleDomainToggle = (domain: string) => {
    if (allDomainsSelected) {
      setAllDomainsSelected(false);
    }

    setLocalSelectedDomains(prev => {
      if (prev.includes(domain)) {
        return prev.filter(d => d !== domain);
      } else {
        return [...prev, domain];
      }
    });
  };

  const handleAllDomainsToggle = () => {
    setAllDomainsSelected(!allDomainsSelected);
    if (!allDomainsSelected) {
      setLocalSelectedDomains([]);
    }
  };

  const handleStartTraining = async () => {
    setIsLoading(true);
    try {
      await startNewSession();
      const domains = allDomainsSelected ? null : localSelectedDomains;
      setSelectedDomains(domains);
      resetSessionStats();
      startSessionTimer();
      setCurrentScreen('training');
    } catch (error) {
      console.error('Failed to start training session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canStartTraining = allDomainsSelected || localSelectedDomains.length > 0;

  if (tagsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen('start')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Select Training Domains</h2>
            <p className="text-muted-foreground">
              Choose which topics you&apos;d like to practice, or select all questions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Training Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* All Domains Option */}
            <div
              className={cn(
                'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all hover:bg-accent',
                allDomainsSelected && 'bg-primary/10 border-primary'
              )}
              onClick={handleAllDomainsToggle}
            >
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border-2',
                  allDomainsSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {allDomainsSelected && <CheckCircle2 className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-medium">All Questions</p>
                <p className="text-sm text-muted-foreground">
                  Practice all available questions across all domains
                </p>
              </div>
            </div>

            {/* Individual Domain Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tagsData?.tags.map((tag) => (
                <div
                  key={tag}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent',
                    localSelectedDomains.includes(tag) && !allDomainsSelected && 'bg-primary/10 border-primary',
                    allDomainsSelected && 'opacity-50'
                  )}
                  onClick={() => !allDomainsSelected && handleDomainToggle(tag)}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2',
                      localSelectedDomains.includes(tag) && !allDomainsSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {localSelectedDomains.includes(tag) && !allDomainsSelected && (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    )}
                  </div>
                  <span className="text-sm font-medium capitalize">{tag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStartTraining}
            disabled={!canStartTraining || isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Starting Session...
              </>
            ) : (
              'Start Training'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}