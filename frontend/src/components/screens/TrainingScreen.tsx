'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Lightbulb, StickyNote, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import {
  useSubmitAnswer,
  useGetHint,
  useGetExplanation,
  useToggleStar,
  useUpdateNote,
  useStartNewSession,
} from '@/hooks/useApi';
import { api, APIError } from '@/lib/api';
import { Question, QuestionResponse } from '@/types';
import { cn, formatSessionTimer } from '@/lib/utils';

export function TrainingScreen() {
  const {
    currentQuestion,
    setCurrentQuestion,
    selectedAnswers,
    setSelectedAnswers,
    sessionStats,
    updateSessionStats,
    selectedDomains,
    setCurrentScreen,
    isLoading,
    setIsLoading,
    stopSessionTimer,
    resetSessionStats,
  } = useAppStore();

  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<QuestionResponse | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [hint, setHint] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);

  const submitAnswer = useSubmitAnswer();
  const getHint = useGetHint();
  const getExplanation = useGetExplanation();
  const toggleStar = useToggleStar();
  const updateNote = useUpdateNote();
  const startNewSession = useStartNewSession();

  useEffect(() => {
    if (!currentQuestion) {
      loadNextQuestion();
    }
  }, [currentQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNextQuestion = async () => {
    setIsLoading(true);
    try {
      const question = await api.questions.getRandom(selectedDomains || undefined);
      setCurrentQuestion(question);
      setSelectedAnswers(new Set());
      setQuestionAnswered(false);
      setAnswerResult(null);
      setExplanation('');
      setShowExplanation(false);
      setNote(question.note || '');
    } catch (error) {
      if (error instanceof APIError && error.status === 410) {
        // Session complete
        await handleSessionComplete(error.message);
        return;
      }
      console.error('Failed to load question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionComplete = async (message: string = 'Session complete!') => {
    stopSessionTimer();
    setShowSessionComplete(true);
    // The modal will show session stats and allow user to return to start
  };

  const handleAnswerSelection = (answerId: string) => {
    if (questionAnswered) return;

    const correctAnswers = Object.entries(currentQuestion?.answers || {})
      .filter(([, answer]) => answer.status === 'correct')
      .map(([id]) => id);

    const isSingleAnswer = correctAnswers.length === 1;
    const newSelectedAnswers = new Set(selectedAnswers);

    if (isSingleAnswer) {
      // Single answer: replace selection
      newSelectedAnswers.clear();
      newSelectedAnswers.add(answerId);
    } else {
      // Multiple answers: toggle selection
      if (newSelectedAnswers.has(answerId)) {
        newSelectedAnswers.delete(answerId);
      } else {
        if (newSelectedAnswers.size >= correctAnswers.length) {
          // Remove oldest selection (simple approach: clear and add new)
          newSelectedAnswers.clear();
        }
        newSelectedAnswers.add(answerId);
      }
    }

    setSelectedAnswers(newSelectedAnswers);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || selectedAnswers.size === 0) return;

    setIsLoading(true);
    try {
      const result = await submitAnswer(
        currentQuestion.question_number,
        Array.from(selectedAnswers)
      );

      setAnswerResult(result);
      setQuestionAnswered(true);

      // Update session stats
      const newStats = {
        total: sessionStats.total + 1,
        correct: sessionStats.correct + (result.is_correct ? 1 : 0),
        accuracy: 0,
        sessionStart: sessionStats.sessionStart,
      };
      newStats.accuracy = Number(((newStats.correct / newStats.total) * 100).toFixed(1));
      updateSessionStats(newStats);

      // Update current question with any changes (like new score)
      setCurrentQuestion(result.question);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!currentQuestion) return;

    setIsLoading(true);
    try {
      const result = await getHint(currentQuestion.question_number);
      setHint(result.hint);
      setShowHintModal(true);
    } catch (error) {
      console.error('Failed to get hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetExplanation = async () => {
    if (!currentQuestion) return;

    setIsLoading(true);
    try {
      const result = await getExplanation(currentQuestion.question_number);
      setExplanation(result.explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('Failed to get explanation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!currentQuestion) return;

    try {
      const newStarred = !currentQuestion.starred;
      await toggleStar(currentQuestion.question_number, newStarred);
      setCurrentQuestion({ ...currentQuestion, starred: newStarred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!currentQuestion) return;

    try {
      await updateNote(currentQuestion.question_number, note);
      setCurrentQuestion({ ...currentQuestion, note });
      setShowNoteModal(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleBackToStart = async () => {
    if (sessionStats.total > 0) {
      if (confirm('End your session? Your progress will be saved but no session metrics will be shown.')) {
        stopSessionTimer();
        await startNewSession();
        resetSessionStats();
        setCurrentScreen('start');
      }
    } else {
      stopSessionTimer();
      setCurrentScreen('start');
    }
  };

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end your current session? Your progress will be saved and you will see your session metrics.')) {
      stopSessionTimer();
      setShowSessionComplete(true);
    }
  };

  const handleSessionCompleteClose = async () => {
    await startNewSession();
    resetSessionStats();
    setCurrentScreen('start');
  };

  if (!currentQuestion && isLoading) {
    return <LoadingOverlay>Loading your next question...</LoadingOverlay>;
  }

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>No question available</p>
      </div>
    );
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={handleBackToStart}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Questions: {sessionStats.total} | Correct: {sessionStats.correct} | Accuracy: {sessionStats.accuracy}%</div>
              <div>Time: {formatSessionTimer(sessionStats.sessionStart)}</div>
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Question #{currentQuestion.question_number}</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.tag.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={handleGetHint}>
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleStar}
                    className={currentQuestion.starred ? 'text-yellow-500' : ''}
                  >
                    <Star className={cn('h-4 w-4', currentQuestion.starred && 'fill-current')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNoteModal(true)}
                    className={currentQuestion.note ? 'text-blue-500' : ''}
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div className="text-lg leading-relaxed">
                {currentQuestion.question_text}
              </div>

              {/* Answers */}
              <div className="space-y-3">
                {Object.entries(currentQuestion.answers).map(([answerId, answer]) => {
                  const isSelected = selectedAnswers.has(answerId);
                  const isCorrect = answer.status === 'correct';
                  const isIncorrect = questionAnswered && isSelected && !isCorrect;
                  const showCorrect = questionAnswered && isCorrect;

                  return (
                    <div
                      key={answerId}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all',
                        !questionAnswered && 'hover:bg-accent',
                        questionAnswered && 'cursor-default',
                        isSelected && !questionAnswered && 'bg-primary/10 border-primary',
                        showCorrect && 'bg-success/10 border-success text-success-foreground',
                        isIncorrect && 'bg-destructive/10 border-destructive text-destructive-foreground'
                      )}
                      onClick={() => handleAnswerSelection(answerId)}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border-2 border-current font-medium">
                        {showCorrect && <CheckCircle className="h-5 w-5" />}
                        {isIncorrect && <XCircle className="h-5 w-5" />}
                        {!questionAnswered && answerId.toUpperCase()}
                        {questionAnswered && !showCorrect && !isIncorrect && answerId.toUpperCase()}
                      </div>
                      <span className="flex-1">{answer.answer_text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Answer Result */}
              {questionAnswered && answerResult && (
                <div className={cn(
                  'rounded-lg border p-4',
                  answerResult.is_correct
                    ? 'bg-success/10 border-success text-success-foreground'
                    : 'bg-destructive/10 border-destructive text-destructive-foreground'
                )}>
                  <div className="flex items-center space-x-2 mb-2">
                    {answerResult.is_correct ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {answerResult.is_correct ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>

                  {showExplanation && explanation && (
                    <div className="mt-4 p-4 bg-background/50 rounded border">
                      <h4 className="font-medium mb-2">Explanation:</h4>
                      <p className="text-sm leading-relaxed">{explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {!questionAnswered && (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswers.size === 0}
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                )}

                {questionAnswered && (
                  <>
                    {!showExplanation && (
                      <Button variant="outline" onClick={handleGetExplanation}>
                        Get Explanation
                      </Button>
                    )}
                    <Button onClick={loadNextQuestion} size="lg">
                      Next Question
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hint Modal */}
      <Modal open={showHintModal} onOpenChange={setShowHintModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>💡 Hint</ModalTitle>
          </ModalHeader>
          <div className="p-4">
            <p>{hint}</p>
          </div>
        </ModalContent>
      </Modal>

      {/* Note Modal */}
      <Modal open={showNoteModal} onOpenChange={setShowNoteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>📝 Add Note</ModalTitle>
            <ModalDescription>Add a personal note for this question</ModalDescription>
          </ModalHeader>
          <div className="p-4 space-y-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your note..."
              className="w-full h-32 p-3 border rounded-md resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote}>Save</Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Session Complete Modal */}
      <Modal open={showSessionComplete} onOpenChange={() => {}}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>🎉 Session Complete!</ModalTitle>
          </ModalHeader>
          <div className="p-4 space-y-4">
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold">{sessionStats.total}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-success">{sessionStats.correct}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{sessionStats.total - sessionStats.correct}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{sessionStats.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
              <Button onClick={handleSessionCompleteClose} size="lg" className="w-full">
                Return to Start
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}