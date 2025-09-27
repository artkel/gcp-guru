'use client';

import React, { useState } from 'react';
import { ArrowLeft, Clock, Target, Trophy, Star, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SessionHistoryChart, DailySessionHistory } from '@/components/charts/SessionHistoryChart';
import { StackedProgressBar } from '@/components/charts/StackedProgressBar';
import { useAppStore } from '@/lib/store';
import { useProgress, useResetProgress, useClearExplanations, useClearHints } from '@/hooks/useApi';
import { formatDuration, formatTrainingTime, getMasteryClass } from '@/lib/utils';
import { SessionHistory } from '@/types';

// Helper function to transform session history data for the chart
const transformSessionHistoryForChart = (history: SessionHistory[]): DailySessionHistory[] => {
  return history.map(session => ({
    ...session,
    // Add dummy or default values for the missing properties
    duration_minutes: session.duration_minutes || 0, 
    tags: session.tags || [],
  }));
};

export function ProgressScreen() {
  const { setCurrentScreen } = useAppStore();
  const { data: progress, isLoading, mutate } = useProgress();
  const resetProgress = useResetProgress();
  const clearExplanations = useClearExplanations();
  const clearHints = useClearHints();

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    scores: true,
    sessionHistory: true,
    stars: true,
    notes: true,
    trainingTime: true
  });

  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      await resetProgress(resetOptions);
      await mutate(); // Refresh progress data
      setShowResetModal(false);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetOptionChange = (option: keyof typeof resetOptions) => {
    setResetOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const hasAnyResetOption = Object.values(resetOptions).some(Boolean);

  const handleClearExplanations = async () => {
    showConfirm({
      title: 'Clear All Explanations',
      description: 'Are you sure you want to delete all explanations? This action cannot be undone.',
      confirmText: 'Clear Explanations',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await clearExplanations();
          await mutate();
        } catch (error) {
          console.error('Failed to clear explanations:', error);
        }
      },
    });
  };

  const handleClearHints = async () => {
    showConfirm({
      title: 'Clear All Hints',
      description: 'Are you sure you want to delete all hints? This action cannot be undone.',
      confirmText: 'Clear Hints',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await clearHints();
          await mutate();
        } catch (error) {
          console.error('Failed to clear hints:', error);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>No progress data available</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentScreen('start')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold">Your Progress</h2>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Last Session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Last Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progress.last_session ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(progress.last_session.session_start).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Questions:</span>
                      <span>{progress.last_session.total_questions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correct:</span>
                      <span className="text-success">{progress.last_session.correct_answers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span>{progress.last_session.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(progress.last_session.duration_minutes)}</span>
                    </div>
                    {progress.last_session.tags && progress.last_session.tags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-muted-foreground">Topics:</span>
                        <div className="flex flex-wrap gap-1">
                          {progress.last_session.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {progress.last_session.tags.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{progress.last_session.tags.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sessions completed yet</p>
                )}
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Overall Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background border border-border rounded-lg">
                    <div className="text-2xl font-bold">{progress.overall.total_questions}</div>
                    <div className="text-xs text-muted-foreground">Total Questions</div>
                  </div>
                  <div className="text-center p-3 bg-background border border-border rounded-lg">
                    <div className="text-2xl font-bold">{formatTrainingTime(progress.overall.total_training_time_minutes)}</div>
                    <div className="text-xs text-muted-foreground">Total Training Time</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{progress.overall.learning_count}</div>
                    <div className="text-xs text-muted-foreground">Learning</div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <div className="text-2xl font-bold text-destructive">{progress.overall.mistakes_count}</div>
                    <div className="text-xs text-muted-foreground">Mistakes</div>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success">{progress.overall.mastered_count}</div>
                    <div className="text-xs text-muted-foreground">Mastered</div>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{progress.overall.perfected_count}</div>
                    <div className="text-xs text-muted-foreground">Perfected</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">Starred:</span>
                    </span>
                    <span>{progress.overall.starred_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">With Notes:</span>
                    </span>
                    <span>{progress.overall.questions_with_notes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Mastery Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StackedProgressBar progress={progress.overall} />
            </CardContent>
          </Card>

          {/* Progress by Topic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Progress by Topic</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Topic</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">Mistakes</th>
                      <th className="text-center p-2">Learning</th>
                      <th className="text-center p-2">Mastered</th>
                      <th className="text-center p-2">Perfected</th>
                      <th className="text-center p-2">Mastery %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.overall.tag_progress.map((tag) => (
                      <tr key={tag.tag} className="border-b hover:bg-accent/50">
                        <td className="p-2 font-medium capitalize">{tag.tag}</td>
                        <td className="text-center p-2">{tag.total_questions}</td>
                        <td className="text-center p-2">
                          <Badge variant="destructive" className="text-xs">
                            {tag.mistakes_count}
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant="secondary" className="text-xs">
                            {tag.learning_count}
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant="success" className="text-xs">
                            {tag.mastered_count}
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <Badge className="text-xs bg-purple-500">
                            {tag.perfected_count}
                          </Badge>
                        </td>
                        <td className="text-center p-2">
                          <span className={getMasteryClass(tag.mastery_percentage)}>
                            {tag.mastery_percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Session History Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Session History (Last 30 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SessionHistoryChart sessionHistory={transformSessionHistoryForChart(progress.session_history)} />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setResetOptions({
                      scores: true,
                      sessionHistory: true,
                      stars: true,
                      notes: true,
                      trainingTime: true
                    });
                    setShowResetModal(true);
                  }}
                >
                  Reset All Progress
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearExplanations}
                >
                  Clear All Explanations
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearHints}
                >
                  Clear All Hints
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal open={showResetModal} onOpenChange={setShowResetModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Reset All Progress</ModalTitle>
            <ModalDescription>
              Are you sure you want to reset the selected progress data? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select which data to reset:</p>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.scores}
                    onChange={() => handleResetOptionChange('scores')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Reset all question scores to 0</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.sessionHistory}
                    onChange={() => handleResetOptionChange('sessionHistory')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Clear all session history</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.stars}
                    onChange={() => handleResetOptionChange('stars')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Remove all stars</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.notes}
                    onChange={() => handleResetOptionChange('notes')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Remove all notes</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetOptions.trainingTime}
                    onChange={() => handleResetOptionChange('trainingTime')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Reset training time statistics</span>
                </label>
              </div>

              {!hasAnyResetOption && (
                <p className="text-sm text-destructive">Please select at least one option to reset.</p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetProgress}
                disabled={isResetting || !hasAnyResetOption}
              >
                {isResetting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Progress'
                )}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </>
  );
}