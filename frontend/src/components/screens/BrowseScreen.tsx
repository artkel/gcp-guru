'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, Star, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { useQuestions, useAvailableTags } from '@/hooks/useApi';
import { Question } from '@/types';
import { cn, debounce } from '@/lib/utils';

export function BrowseScreen() {
  const { setCurrentScreen } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'question_number' | 'score'>('question_number');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const { data: tagsData } = useAvailableTags();
  const { data: questions, isLoading } = useQuestions({
    search: searchTerm,
    tags: selectedTag ? [selectedTag] : undefined,
    starred_only: starredOnly,
  });

  // Debounced search handler
  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionModal(true);
  };

  const sortedQuestions = questions?.sort((a, b) => {
    if (sortBy === 'score') {
      return a.score - b.score; // Ascending order (weakest first)
    }
    return a.question_number - b.question_number;
  }) || [];

  const renderQuestionModal = () => {
    if (!selectedQuestion) return null;

    const correctAnswers = Object.entries(selectedQuestion.answers)
      .filter(([, answer]) => answer.status === 'correct')
      .map(([id]) => id);

    return (
      <Modal open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <ModalContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Question #{selectedQuestion.question_number}</ModalTitle>
          </ModalHeader>
          <div className="p-6 space-y-6">
            {/* Question Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedQuestion.tag.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-4">
                  {selectedQuestion.starred && (
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">Starred</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Score: <span className="font-medium">{selectedQuestion.score}</span>
                  </div>
                </div>
              </div>

              <div className="text-lg leading-relaxed">
                {selectedQuestion.question_text}
              </div>
            </div>

            {/* Answers */}
            <div className="space-y-3">
              {Object.entries(selectedQuestion.answers).map(([answerId, answer]) => (
                <div
                  key={answerId}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg border p-4',
                    answer.status === 'correct'
                      ? 'bg-success/10 border-success text-success-foreground'
                      : 'bg-secondary'
                  )}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border-2 border-current font-medium">
                    {answerId.toUpperCase()}
                  </div>
                  <span className="flex-1">{answer.answer_text}</span>
                  {answer.status === 'correct' && (
                    <Badge variant="success" className="text-xs">
                      Correct
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Note */}
            {selectedQuestion.note && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Your Note</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{selectedQuestion.note}</p>
              </div>
            )}
          </div>
        </ModalContent>
      </Modal>
    );
  };

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
            <h2 className="text-2xl font-bold">Browse Questions</h2>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>

                {/* Tag Filter */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Topics</option>
                  {tagsData?.tags.map((tag) => (
                    <option key={tag} value={tag} className="capitalize">
                      {tag}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'question_number' | 'score')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="question_number">Sort by Question #</option>
                  <option value="score">Sort by Score (Weakest First)</option>
                </select>

                {/* Starred Only */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={starredOnly}
                    onChange={(e) => setStarredOnly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Starred Only</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : sortedQuestions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No questions found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              sortedQuestions.map((question) => (
                <Card
                  key={question.question_number}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]"
                  onClick={() => handleQuestionClick(question)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Question #{question.question_number}</h3>
                          <div className="flex flex-wrap gap-2">
                            {question.tag.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {question.starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {question.note && (
                            <FileText className="h-4 w-4 text-blue-500" />
                          )}
                          <div className="text-sm text-muted-foreground">
                            Score: <span className="font-medium">{question.score}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <p className="text-muted-foreground line-clamp-2">
                        {question.question_text.length > 200
                          ? `${question.question_text.substring(0, 200)}...`
                          : question.question_text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Results Count */}
          {!isLoading && sortedQuestions.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {renderQuestionModal()}
    </>
  );
}