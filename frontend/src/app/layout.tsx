import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GCP Guru - Professional Cloud Architect Exam Prep',
  description: 'Interactive flashcard learning application for Google Cloud Professional Cloud Architect certification exam',
  keywords: 'GCP, Google Cloud, certification, flashcards, learning, Professional Cloud Architect',
  authors: [{ name: 'GCP Guru' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
        <ErrorBoundary>
          <ThemeProvider>
            <SWRProvider>
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
            </SWRProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}