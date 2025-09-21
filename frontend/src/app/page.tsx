'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { StartScreen } from '@/components/screens/StartScreen';
import { DomainSelectionScreen } from '@/components/screens/DomainSelectionScreen';
import { TrainingScreen } from '@/components/screens/TrainingScreen';
import { ProgressScreen } from '@/components/screens/ProgressScreen';
import { BrowseScreen } from '@/components/screens/BrowseScreen';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentScreen } = useAppStore();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return <StartScreen />;
      case 'domain-selection':
        return <DomainSelectionScreen />;
      case 'training':
        return <TrainingScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'browse':
        return <BrowseScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        {renderScreen()}
      </main>
    </>
  );
}