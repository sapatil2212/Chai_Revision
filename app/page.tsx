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
import { CurrentAffairsSection } from '@/components/home/CurrentAffairsSection';
import { FeaturedCoursesSection } from '@/components/home/FeaturedCoursesSection';
import { FreeResourcesSection } from '@/components/home/FreeResourcesSection';
import { ImportantDatesSection } from '@/components/home/ImportantDatesSection';
import { WhyChaiRevisionSection } from '@/components/home/WhyChaiRevisionSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Dedicated Views
import { MaterialsView } from '@/components/views/MaterialsView';
import { CoursesView } from '@/components/views/CoursesView';
import { PYQView } from '@/components/views/PYQView';
import { MCQQuizView } from '@/components/views/MCQQuizView';
import { ExamUpdatesView } from '@/components/views/ExamUpdatesView';
import { ImportantDatesView } from '@/components/views/ImportantDatesView';
import { CurrentAffairsView } from '@/components/views/CurrentAffairsView';
import { BlogsView } from '@/components/views/BlogsView';
import { FreeResourcesView } from '@/components/views/FreeResourcesView';
import { CheckoutView } from '@/components/views/CheckoutView';
import { OrderSuccessView } from '@/components/views/OrderSuccessView';
import { DashboardView } from '@/components/views/DashboardView';
import { AdminPortalView } from '@/components/views/AdminPortalView';

import { Sparkles, MessageSquare } from 'lucide-react';

function MainContent() {
  const { activeView, setIsAIAssistantOpen } = useApp();

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
              <CurrentAffairsSection />
            </ScrollReveal>
            <ScrollReveal delay={75}>
              <FeaturedCoursesSection />
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
        {activeView === 'courses' && <CoursesView />}
        {activeView === 'pyq' && <PYQView />}
        {activeView === 'quiz' && <MCQQuizView />}
        {activeView === 'exam-updates' && <ExamUpdatesView />}
        {activeView === 'important-dates' && <ImportantDatesView />}
        {activeView === 'current-affairs' && <CurrentAffairsView />}
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
