'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Shuffle, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Switch } from '@/components/ui/Switch';
import { useAppStore } from '@/lib/store';
import { useAvailableTags, useStartNewSession } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';

export function DomainSelectionScreen() {
  const {
    setCurrentScreen,
    setSelectedDomains,
    selectedDomains,
    setIsLoading,
    isLoading,
    resetSessionStats,
    startSessionTimer,
    useShuffledQuestions,
    setUseShuffledQuestions,
    setSelectedMasteryLevels,
  } = useAppStore();

  const { data: tagsData, isLoading: tagsLoading } = useAvailableTags();
  const startNewSession = useStartNewSession();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  const [localSelectedDomains, setLocalSelectedDomains] = useState<string[]>([]);
  const [allDomainsSelected, setAllDomainsSelected] = useState(false);
  const [starredQuestionsSelected, setStarredQuestionsSelected] = useState(false);
  const [hasStarredQuestions, setHasStarredQuestions] = useState(false);
  const [starredQuestionsLoading, setStarredQuestionsLoading] = useState(false);
  const [availableMasteryLevels, setAvailableMasteryLevels] = useState<Record<string, boolean>>({
    mistakes: true,
    learning: true,
    mastered: true,
    perfected: true
  });
  const [localSelectedMasteryLevels, setLocalSelectedMasteryLevels] = useState<string[]>([
    'mistakes', 'learning', 'mastered', 'perfected'
  ]);
  const [showMasteryDropdown, setShowMasteryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateAvailableMasteryLevels = useCallback(async () => {
    try {
      let tags = undefined;
      if (allDomainsSelected) {
        tags = undefined;
      } else {
        tags = [...localSelectedDomains];
        if (starredQuestionsSelected) {
          tags.push('starred');
        }
        if (tags.length === 0) {
          tags = undefined;
        }
      }
      const result = await api.progress.getAvailableMasteryLevels(tags);
      setAvailableMasteryLevels(result.mastery_levels);
    } catch (error) {
      console.error('Failed to get available mastery levels:', error);
    }
  }, [allDomainsSelected, localSelectedDomains, starredQuestionsSelected]);

  useEffect(() => {
    let isCancelled = false;

    // Reset all selections when the screen mounts to ensure a fresh start
    setLocalSelectedDomains([]);
    setAllDomainsSelected(false);
    setStarredQuestionsSelected(false);
    setSelectedDomains(null); // Explicitly clear global state too
    setLocalSelectedMasteryLevels(['mistakes', 'learning', 'mastered', 'perfected']); // Reset mastery levels

    const checkStarredQuestions = async () => {
      try {
        const questions = await api.questions.getList();
        const starredQuestions = questions.filter(q => q.starred);

        if (!isCancelled) {
          setHasStarredQuestions(starredQuestions.length > 0);
        }
      } catch (error) {
        console.error('Failed to check starred questions:', error);
        if (!isCancelled) {
          setHasStarredQuestions(false);
        }
      }
    };

    checkStarredQuestions();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update available mastery levels when domain selection changes
  useEffect(() => {
    updateAvailableMasteryLevels();
  }, [updateAvailableMasteryLevels]);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMasteryDropdown(false);
      }
    };

    if (showMasteryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMasteryDropdown]);

  const handleDomainToggle = (domain: string) => {
    if (allDomainsSelected) {
      return; // Don't allow tag selection when All Questions is selected
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
      setStarredQuestionsSelected(false);
    }
  };

  const handleStarredQuestionsToggle = () => {
    if (!hasStarredQuestions) return;

    setStarredQuestionsSelected(!starredQuestionsSelected);
    if (!starredQuestionsSelected) {
      setAllDomainsSelected(false);
    }
  };

  const handleMasteryLevelToggle = (level: string) => {
    setLocalSelectedMasteryLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  const refreshStarredQuestions = async () => {
    setStarredQuestionsLoading(true);
    console.log('Manually refreshing starred questions...');
    try {
      const questions = await api.questions.getList();
      const starredCount = questions.filter(q => q.starred).length;
      setHasStarredQuestions(starredCount > 0);
      console.log(`Manual refresh: Found ${starredCount} starred questions`);
    } catch (error) {
      console.error('Failed to refresh starred questions:', error);
      setHasStarredQuestions(false);
    } finally {
      setStarredQuestionsLoading(false);
    }
  };

  const proceedToTraining = async () => {
    setIsLoading(true);
    try {
      await startNewSession();
      let domains = null;
      if (allDomainsSelected) {
        domains = null; // All questions
      } else {
        domains = [...localSelectedDomains];
        if (starredQuestionsSelected) {
          domains.push('starred');
        }
        if (domains.length === 0) {
          domains = null; // If nothing selected, default to all
        }
      }
      setSelectedDomains(domains);
      setSelectedMasteryLevels(localSelectedMasteryLevels.length > 0 ? localSelectedMasteryLevels : ['mistakes', 'learning', 'mastered', 'perfected']);
      resetSessionStats();
      startSessionTimer();
      setCurrentScreen('training');
    } catch (error) {
      console.error('Failed to start training session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTraining = async () => {
    // Double-check that we have valid selections before proceeding
    if (!canStartTraining) {
      console.error('Start Training called without valid selections');
      return;
    }

    let domains = undefined;
    if (allDomainsSelected) {
      domains = undefined;
    } else {
      domains = [...localSelectedDomains];
      if (starredQuestionsSelected) {
        domains.push('starred');
      }
      if (domains.length === 0) {
        domains = undefined;
      }
    }

    // Check if all questions in the selected tags are mastered (skip for pure starred questions)
    if (starredQuestionsSelected && localSelectedDomains.length === 0) {
      proceedToTraining();
      return;
    }

    try {
      const status = await api.progress.getStatus(domains);
      if (status.all_mastered) {
        showConfirm({
          title: 'All Questions Mastered',
          description: 'All questions for the selected domain(s) have a score of 4 or more. Would you like to start a review session with these questions anyway?',
          confirmText: 'Start Review Session',
          onConfirm: proceedToTraining,
        });
      } else {
        proceedToTraining();
      }
    } catch (error) {
      console.error('Failed to get progress status:', error);
      // If the check fails, proceed to training anyway
      proceedToTraining();
    }
  };

  const canStartTraining = (allDomainsSelected || starredQuestionsSelected || localSelectedDomains.length > 0) && localSelectedMasteryLevels.length > 0;

  if (tagsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
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
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Training Topics</CardTitle>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowMasteryDropdown(!showMasteryDropdown)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
                  >
                    <span>Mastery</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      showMasteryDropdown && "rotate-180"
                    )} />
                  </button>

                  {showMasteryDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                      <div className="p-2 space-y-1">
                        {[
                          { id: 'mistakes', label: 'Mistakes', selectedClass: 'bg-destructive text-white', hoverClass: 'hover:bg-destructive/90' },
                          { id: 'learning', label: 'Learning', selectedClass: 'bg-muted text-muted-foreground', hoverClass: 'hover:bg-muted/90' },
                          { id: 'mastered', label: 'Mastered', selectedClass: 'bg-success text-white', hoverClass: 'hover:bg-success/90' },
                          { id: 'perfected', label: 'Perfected', selectedClass: 'bg-purple-500 text-white', hoverClass: 'hover:bg-purple-600' }
                        ].map(({ id, label, selectedClass, hoverClass }) => {
                          const isSelected = localSelectedMasteryLevels.includes(id);
                          const isAvailable = availableMasteryLevels[id];

                          return (
                            <button
                              key={id}
                              onClick={() => isAvailable && handleMasteryLevelToggle(id)}
                              disabled={!isAvailable}
                              className={cn(
                                'w-full px-3 py-2 rounded-md text-sm font-medium transition-all text-left',
                                isSelected && isAvailable && selectedClass,
                                isSelected && isAvailable && hoverClass,
                                !isSelected && isAvailable && 'border border-border hover:bg-accent',
                                !isAvailable && 'opacity-30 cursor-not-allowed border border-border'
                              )}
                              title={!isAvailable ? `No ${id} questions available for selected tags` : ''}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top Row: All Questions and Starred Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                {/* All Domains Option */}
                <div
                  className={cn(
                    'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all hover:bg-accent min-h-[80px]',
                    allDomainsSelected && 'bg-primary/10 border-primary'
                  )}
                  onClick={handleAllDomainsToggle}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2 flex-shrink-0',
                      allDomainsSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {allDomainsSelected && <CheckCircle2 className="h-2.5 w-2.5" />}
                  </div>
                  <div>
                    <p className="font-medium">All Questions</p>
                    <p className="text-sm text-muted-foreground">
                      Practice all available questions across all domains
                    </p>
                  </div>
                </div>

                {/* Starred Questions Option */}
                <div
                  className={cn(
                    'flex items-center space-x-3 rounded-lg border p-4 min-h-[80px]',
                    hasStarredQuestions && !allDomainsSelected
                      ? 'cursor-pointer hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed',
                    starredQuestionsSelected && 'bg-primary/10 border-primary'
                  )}
                  onClick={() => {
                    if (hasStarredQuestions && !allDomainsSelected) {
                      handleStarredQuestionsToggle();
                    }
                  }}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2 flex-shrink-0',
                      starredQuestionsSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {starredQuestionsSelected && <CheckCircle2 className="h-2.5 w-2.5" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        Starred Questions
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasStarredQuestions ? 'Practice your bookmarked questions' : 'No starred questions available'}
                      </p>
                    </div>
                  </div>
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

          {/* Answer Shuffling Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Answer Shuffling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Shuffle answer positions</p>
                  <p className="text-sm text-muted-foreground">
                    Randomize A, B, C, D positions to prevent memorization by position
                  </p>
                </div>
                <Switch
                  checked={useShuffledQuestions}
                  onCheckedChange={setUseShuffledQuestions}
                  size="md"
                />
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
      <ConfirmDialog />
    </>
  );
}