'use client';

import React from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/modals/SearchModal';
import { CartDrawer } from '@/components/modals/CartDrawer';
import { PdfPreviewModal } from '@/components/modals/PdfPreviewModal';
import { AIAssistantDrawer } from '@/components/ai/AIAssistantDrawer';

// Home Sections
import { HeroSection } from '@/components/home/HeroSection';
import { ExamCategoriesSection } from '@/components/home/ExamCategoriesSection';
import { FeaturedMaterialsSection } from '@/components/home/FeaturedMaterialsSection';
import { LatestUpdatesSection } from '@/components/home/LatestUpdatesSection';
import { FreeResourcesSection } from '@/components/home/FreeResourcesSection';
import { ImportantDatesSection } from '@/components/home/ImportantDatesSection';
import { WhyChaiRevisionSection } from '@/components/home/WhyChaiRevisionSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Dedicated Views
import { MaterialsView } from '@/components/views/MaterialsView';
import { PYQView } from '@/components/views/PYQView';
import { MCQQuizView } from '@/components/views/MCQQuizView';
import { ComingSoonView } from '@/components/views/ComingSoonView';
import { ImportantDatesView } from '@/components/views/ImportantDatesView';
import { BlogsView } from '@/components/views/BlogsView';
import { FreeResourcesView } from '@/components/views/FreeResourcesView';
import { CheckoutView } from '@/components/views/CheckoutView';
import { OrderSuccessView } from '@/components/views/OrderSuccessView';
import { DashboardView } from '@/components/views/DashboardView';
import { AdminPortalView } from '@/components/views/AdminPortalView';

import { Sparkles, MessageSquare } from 'lucide-react';

function MainContent() {
  const { activeView, setIsAIAssistantOpen, t } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-clip">
      {/* Global Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <main className={`flex-1 pb-20 md:pb-8 overflow-x-clip ${activeView === 'home' ? 'pt-0' : 'pt-18 sm:pt-20'}`}>
        {activeView === 'home' && (
          <>
            <HeroSection />
            <ScrollReveal delay={75}>
              <ExamCategoriesSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <FeaturedMaterialsSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <LatestUpdatesSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <FreeResourcesSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <ImportantDatesSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <WhyChaiRevisionSection />
            </ScrollReveal>
          </>
        )}

        {activeView === 'materials' && <MaterialsView />}
        {activeView === 'pyq' && <PYQView />}
        {activeView === 'quiz' && <MCQQuizView />}
        {/* Exam Updates temporarily disabled; restore <ExamUpdatesView /> when ready */}
        {activeView === 'exam-updates' && <ComingSoonView title={t.nav.examUpdates} />}
        {activeView === 'important-dates' && <ImportantDatesView />}
        {activeView === 'blogs' && <BlogsView />}
        {activeView === 'free-resources' && <FreeResourcesView />}
        {activeView === 'checkout' && <CheckoutView />}
        {activeView === 'order-success' && <OrderSuccessView />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'admin' && <AdminPortalView />}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Global Interactive Drawers & Modals */}
      <SearchModal />
      <CartDrawer />
      <PdfPreviewModal />
      <AIAssistantDrawer />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
