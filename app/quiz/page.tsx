'use client';

import React from 'react';
import { AppProvider } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/modals/SearchModal';
import { CartDrawer } from '@/components/modals/CartDrawer';
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
      <CartDrawer />
      <PdfPreviewModal />
      <AIAssistantDrawer />
    </div>
  );
}

export default function QuizPage() {
  return (
    <AppProvider>
      <QuizPageContent />
    </AppProvider>
  );
}
