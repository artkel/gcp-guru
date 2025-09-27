'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
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

interface SessionHistoryChartProps {
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{data.displayDate}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-success rounded mr-2"></span>
            Correct: {data.correct}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-destructive rounded mr-2"></span>
            Incorrect: {data.incorrect}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total:</span> {data.total}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Accuracy:</span> {data.accuracy.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value > 0) {
    return (
      <text
        x={x + width / 2}
        y={y}
        dy={-4}
        fontSize={12}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
      >
        {value}
      </text>
    );
  }
  return null;
};

export function SessionHistoryChart({ sessionHistory }: SessionHistoryChartProps) {
  // Generate last 30 days data
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
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="correct"
            stackId="answers"
            name="Correct"
            fill="hsl(var(--success))"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="incorrect"
            stackId="answers"
            name="Incorrect"
            fill="hsl(var(--destructive))"
            radius={[2, 2, 0, 0]}
          >
            <LabelList dataKey="total" content={renderCustomizedLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}