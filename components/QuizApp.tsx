'use client';

import React from 'react';
import { AppProvider } from '@/lib/store';
import type { ExamUpdate, Product } from '@/lib/types';
import type { QuizSummary } from '@/lib/quizTypes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/modals/SearchModal';
import { PdfPreviewModal } from '@/components/modals/PdfPreviewModal';
import { AIAssistantDrawer } from '@/components/ai/AIAssistantDrawer';
import { MCQQuizView } from '@/components/views/MCQQuizView';

function QuizPageContent() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-clip font-['Poppins',sans-serif]">
      {/* Global Navigation Header */}
      <Header />

      {/* Main MCQ Quiz Content */}
      <main className="flex-1 pt-18 sm:pt-20 pb-20 md:pb-8 overflow-x-clip">
        <MCQQuizView />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Global Modals & Drawers */}
      <SearchModal />
      <PdfPreviewModal />
      <AIAssistantDrawer />
    </div>
  );
}

export function QuizApp({
  materials,
  examUpdates,
  quizzes,
}: {
  materials?: Product[];
  examUpdates?: ExamUpdate[];
  quizzes?: QuizSummary[];
}) {
  return (
    <AppProvider initialMaterials={materials} initialExamUpdates={examUpdates} initialQuizzes={quizzes}>
      <QuizPageContent />
    </AppProvider>
  );
}
