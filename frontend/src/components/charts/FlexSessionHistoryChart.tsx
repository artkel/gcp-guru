'use client';

import React from 'react';
import { format, subDays } from 'date-fns';

export interface DailySessionHistory {
  date: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  duration_minutes: number;
  tags: string[];
}

interface FlexSessionHistoryChartProps {
  sessionHistory: DailySessionHistory[];
}

interface ChartData {
  date: string;
  displayDate: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
}

export function FlexSessionHistoryChart({ sessionHistory }: FlexSessionHistoryChartProps) {
  const generateChartData = (): ChartData[] => {
    const today = new Date();
    const chartData: ChartData[] = [];

    // Create a map of existing session data by date
    const sessionMap = new Map<string, DailySessionHistory>();
    sessionHistory.forEach(session => {
      sessionMap.set(session.date, session);
    });

    // Generate data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const session = sessionMap.get(dateStr);

      chartData.push({
        date: dateStr,
        displayDate: format(date, 'MMM dd'),
        correct: session?.correct_answers || 0,
        incorrect: session?.incorrect_answers || 0,
        total: session?.total_questions || 0,
        accuracy: session?.accuracy || 0,
      });
    }

    return chartData;
  };

  const chartData = generateChartData();
  const hasData = chartData.some(d => d.total > 0);
  const maxTotal = Math.max(...chartData.map(d => d.total), 1); // Ensure at least 1 for scaling

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No session data yet</p>
          <p className="text-sm">Start answering questions to see your progress chart!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded"></div>
          <span className="text-sm text-muted-foreground">Correct</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-destructive rounded"></div>
          <span className="text-sm text-muted-foreground">Incorrect</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-48 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground w-8">
          <span>{maxTotal}</span>
          <span>{Math.floor(maxTotal * 0.75)}</span>
          <span>{Math.floor(maxTotal * 0.5)}</span>
          <span>{Math.floor(maxTotal * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart bars */}
        <div className="ml-10 h-full flex items-end justify-between">
          {chartData.map((day, index) => {
            const barHeight = day.total > 0 ? (day.total / maxTotal) * 100 : 0;
            const correctHeight = day.total > 0 ? (day.correct / day.total) * barHeight : 0;
            const incorrectHeight = day.total > 0 ? (day.incorrect / day.total) * barHeight : 0;

            return (
              <div
                key={day.date}
                className="flex flex-col items-center group relative"
                style={{ width: 'calc(100% / 30)' }}
              >
                {/* Bar container */}
                <div
                  className="w-full max-w-6 relative flex flex-col justify-end bg-secondary/20 rounded-sm"
                  style={{ height: '100%' }}
                >
                  {day.total > 0 && (
                    <>
                      {/* Stacked bars */}
                      <div
                        className="w-full bg-destructive rounded-t-sm"
                        style={{ height: `${incorrectHeight}%` }}
                      />
                      <div
                        className="w-full bg-success"
                        style={{ height: `${correctHeight}%` }}
                      />

                      {/* Total label above bar */}
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 text-xs text-muted-foreground font-medium"
                      >
                        {day.total}
                      </div>
                    </>
                  )}
                </div>

                {/* Date label */}
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  {index % 5 === 0 || day.total > 0 ? day.displayDate : ''}
                </div>

                {/* Tooltip */}
                {day.total > 0 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-32">
                      <p className="font-medium text-sm">{day.displayDate}</p>
                      <div className="space-y-1 mt-2">
                        <p className="text-xs">
                          <span className="inline-block w-2 h-2 bg-success rounded mr-2"></span>
                          Correct: {day.correct}
                        </p>
                        <p className="text-xs">
                          <span className="inline-block w-2 h-2 bg-destructive rounded mr-2"></span>
                          Incorrect: {day.incorrect}
                        </p>
                        <p className="text-xs">
                          <span className="text-muted-foreground">Total:</span> {day.total}
                        </p>
                        <p className="text-xs">
                          <span className="text-muted-foreground">Accuracy:</span> {day.accuracy.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 ml-10 pointer-events-none">
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={ratio}
              className="absolute w-full border-t border-border/30"
              style={{ bottom: `${ratio * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}