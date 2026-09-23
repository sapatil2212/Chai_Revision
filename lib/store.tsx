'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  Product,
  Order,
  NotificationItem,
  UserProfile,
} from './types';
import { STUDY_MATERIALS_DATA, COURSES_DATA } from './data';
import { translations } from './i18n';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations['mr'];
  
  // Navigation / View State
  activeView: string;
  viewParams: Record<string, string>;
  navigateTo: (view: string, params?: Record<string, string>) => void;

  // Cart
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;

  // User & Purchases
  user: UserProfile | null;
  loginDemoUser: () => void;
  logoutUser: () => void;
  purchasedProducts: Product[];
  orders: Order[];
  createOrder: (paymentMethod: string) => Order;
  
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

  // Cart Drawer
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // AI Assistant Drawer
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;

  // PDF Preview Modal
  previewProduct: Product | null;
  setPreviewProduct: (p: Product | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('mr');
  const [activeView, setActiveView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, string>>({});
  
  const [cart, setCart] = useState<Product[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>({
    name: 'समीर देशपांडे (Aspirant)',
    email: 'sameer.mpsc2026@gmail.com',
    mobile: '+91 98230 45678',
    preferredLanguage: 'mr',
    targetExams: ['MPSC', 'PSI', 'Talathi'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    joinedDate: 'जानेवारी २०२६',
  });

  const [purchasedProducts, setPurchasedProducts] = useState<Product[]>([
    STUDY_MATERIALS_DATA[0], // MPSC Polity Notes pre-owned for demo
    STUDY_MATERIALS_DATA[7], // Free guide pre-owned
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'CR-2026-89412',
      date: '१२ सप्टेंबर २०२६',
      items: [STUDY_MATERIALS_DATA[0]],
      totalAmount: 149,
      status: 'Completed',
      paymentId: 'pay_RPZ948123049',
      paymentMethod: 'UPI / Google Pay',
      downloadToken: 'tok_mpsc_polity_sec_994812',
      tokenExpiresAt: 'कायमस्वरूपी सक्रिय (Lifetime)',
    },
  ]);

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
      link: 'downloads',
    },
  ]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
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

  const addToCart = (product: Product) => {
    if (!cart.some((item) => item.id === product.id)) {
      setCart((prev) => [...prev, product]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'CHAI10' || cleanCode === 'MPSC2026' || cleanCode === 'REVISION') {
      setAppliedCoupon(cleanCode);
      return true;
    }
    return false;
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const cartSubtotal = cart.reduce((acc, p) => acc + p.discountedPrice, 0);
  const couponDiscountAmount = appliedCoupon ? Math.round(cartSubtotal * 0.1) : 0;
  const cartDiscount = couponDiscountAmount;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const loginDemoUser = () => {
    setUser({
      name: 'समीर देशपांडे (Aspirant)',
      email: 'sameer.mpsc2026@gmail.com',
      mobile: '+91 98230 45678',
      preferredLanguage: lang,
      targetExams: ['MPSC', 'PSI', 'Talathi'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      joinedDate: 'जानेवारी २०२६',
    });
  };

  const logoutUser = () => {
    setUser(null);
  };

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

  const createOrder = (paymentMethod: string): Order => {
    const newOrder: Order = {
      id: `CR-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('mr-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      items: [...cart],
      totalAmount: cartTotal,
      status: 'Completed',
      paymentId: `pay_rzp_${Math.random().toString(36).substring(2, 9)}`,
      paymentMethod,
      downloadToken: `token_chai_sec_${Math.random().toString(36).substring(2, 12)}`,
      tokenExpiresAt: 'कायमस्वरूपी सक्रिय (Permanent Access)',
    };

    // Add items to purchased list
    setPurchasedProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newItems = cart.filter((item) => !existingIds.has(item.id));
      return [...newItems, ...prev];
    });

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        activeView,
        viewParams,
        navigateTo,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        user,
        loginDemoUser,
        logoutUser,
        purchasedProducts,
        orders,
        createOrder,
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
        isCartOpen,
        setIsCartOpen,
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
