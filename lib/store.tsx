'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  Product,
  ExamUpdate,
  NotificationItem,
} from './types';
import { STUDY_MATERIALS_DATA, EXAM_UPDATES_DATA } from './data';
import { translations } from './i18n';
import type { QuizSummary } from './quizTypes';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations['mr'];

  // Catalog content (loaded from the database on the server)
  materials: Product[];
  examUpdates: ExamUpdate[];
  /** Published quizzes (summaries only; questions load when a test starts). Empty if DB unavailable. */
  quizzes: QuizSummary[];
  
  // Navigation / View State
  activeView: string;
  viewParams: Record<string, string>;
  navigateTo: (view: string, params?: Record<string, string>) => void;

  // Purchases (direct single-item checkout; no cart)
  /** Materials bought in this browser session. The authoritative record is the orders table. */
  purchasedProducts: Product[];
  /** Adds verified purchases to this session's library. Payments are recorded server-side. */
  recordPurchase: (items: Product[]) => void;

  // Bookmarks
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  unreadNotificationsCount: number;

  // Global Search Modal / State
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // AI Assistant Drawer
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;

  // PDF Preview Modal
  previewProduct: Product | null;
  setPreviewProduct: (p: Product | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: React.ReactNode;
  /** Published materials from the DB. Falls back to bundled static data if not provided. */
  initialMaterials?: Product[];
  /** Published exam updates from the DB. Falls back to bundled static data if not provided. */
  initialExamUpdates?: ExamUpdate[];
  initialQuizzes?: QuizSummary[];
}

export function AppProvider({ children, initialMaterials, initialExamUpdates, initialQuizzes }: AppProviderProps) {
  const materials = initialMaterials ?? STUDY_MATERIALS_DATA;
  const examUpdates = initialExamUpdates ?? EXAM_UPDATES_DATA;
  const quizzes = initialQuizzes ?? [];
  const [lang, setLangState] = useState<Language>('mr');
  const [activeView, setActiveView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, string>>({});

  // Materials bought in this session (direct checkout, no cart). The orders table is authoritative.
  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([]);

  const [bookmarks, setBookmarks] = useState<string[]>(['mat-2', 'pyq-1', 'blog-1']);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'MPSC राज्यसेवा प्रवेशपत्र प्रसिद्ध',
      message: 'राज्यसेवा पूर्व परीक्षेसाठी हॉल तिकीट डाऊनलोड उपलब्ध झाले आहे.',
      date: '२ तास आधी',
      type: 'exam',
      read: false,
      link: 'exam-updates',
    },
    {
      id: 'notif-2',
      title: 'नवीन ई-बुक उपलब्ध: अर्थव्यवस्था २०२६',
      message: 'आर्थिक पाहणी व बजेट वन-लाइनर्स आता उपलब्ध आहेत.',
      date: 'काल',
      type: 'material',
      read: false,
      link: 'materials',
    },
    {
      id: 'notif-3',
      title: 'ऑर्डर यशस्वी झाली',
      message: 'MPSC राज्यघटना मास्टर रिव्हिजन नोट्स तुमच्या लायब्ररीमध्ये जोडली गेली.',
      date: '३ दिवस आधी',
      type: 'system',
      read: true,
      link: 'materials',
    },
  ]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Sync initial hash or history on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
          const parts = hash.split('/');
          const view = parts[0] || 'home';
          const param = parts[1] || '';
          setActiveView(view);
          if (param) {
            setViewParams({ slug: param, id: param });
          }
        }
      };

      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  const navigateTo = (view: string, params: Record<string, string> = {}) => {
    setActiveView(view);
    setViewParams(params);
    if (typeof window !== 'undefined') {
      const hash = params.slug || params.id ? `${view}/${params.slug || params.id}` : view;
      window.location.hash = hash;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  const t = translations[lang] || translations.mr;

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  /**
   * Called after a payment has been verified server-side, so the buyer's library
   * reflects what they just bought. The authoritative record is the `orders` table;
   * this only updates what is on screen for this session.
   */
  const recordPurchase = (items: Product[]) => {
    if (!items.length) return;
    setPurchasedProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      return [...items.filter((item) => !existingIds.has(item.id)), ...prev];
    });
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        materials,
        examUpdates,
        quizzes,
        activeView,
        viewParams,
        navigateTo,
        purchasedProducts,
        recordPurchase,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        notifications,
        markNotificationAsRead,
        unreadNotificationsCount,
        isSearchOpen,
        setIsSearchOpen,
        searchQuery,
        setSearchQuery,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        previewProduct,
        setPreviewProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
