'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  Search,
  Plus,
  Download,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Menu,
  TrendingUp,
  Activity,
  Server,
  LogOut,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Terminal,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  SlidersHorizontal,
  Copy,
  Check,
  Clock,
  Sparkles,
  DollarSign,
  AlertTriangle,
  FolderOpen,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';
import { ChaiLogo } from '@/components/brand/ChaiLogo';
import { STUDY_MATERIALS_DATA, EXAM_UPDATES_DATA } from '@/lib/data';

// =========================================================================
// TYPES & MOCK DATA
// =========================================================================
interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  exam: string;
  notesPurchased: number;
  totalSpent: number;
  registeredDate: string;
  status: 'Active' | 'Inactive';
}

interface TransactionRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  materialTitle: string;
  examCategory: string;
  amount: number;
  paymentMethod: 'UPI - PhonePe' | 'UPI - GPay' | 'Netbanking - SBI' | 'Debit Card';
  timestamp: string;
  status: 'Success' | 'Processing' | 'Failed';
}

interface AuditLogRecord {
  id: string;
  timestamp: string;
  level: 'AUTH' | 'PAYMENT' | 'SYSTEM' | 'SECURITY';
  actor: string;
  ip: string;
  message: string;
}

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'STU-101',
    name: 'Omkar Shinde',
    email: 'omkar.shinde@gmail.com',
    phone: '+91 98231 45621',
    district: 'Pune (पुणे)',
    exam: 'MPSC Rajyaseva',
    notesPurchased: 4,
    totalSpent: 476,
    registeredDate: '12 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-102',
    name: 'Priyanka Jadhav',
    email: 'priyanka.j@rediffmail.com',
    phone: '+91 94220 89123',
    district: 'Chhatrapati Sambhaji Nagar',
    exam: 'Police Bharti 2026',
    notesPurchased: 3,
    totalSpent: 357,
    registeredDate: '14 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-103',
    name: 'Akshay Patil',
    email: 'akshay.patil.mpsc@outlook.com',
    phone: '+91 99214 77312',
    district: 'Kolhapur (कोल्हापूर)',
    exam: 'MPSC Combine Group B (PSI/STI)',
    notesPurchased: 6,
    totalSpent: 714,
    registeredDate: '18 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-104',
    name: 'Sneha Deshmukh',
    email: 'sneha.deshmukh24@gmail.com',
    phone: '+91 97632 11984',
    district: 'Nashik (नाशिक)',
    exam: 'Talathi Bharti TCS Pattern',
    notesPurchased: 2,
    totalSpent: 238,
    registeredDate: '19 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-105',
    name: 'Rohan Kadam',
    email: 'rohan.kadam.upsc@gmail.com',
    phone: '+91 98901 33456',
    district: 'Mumbai Suburbs',
    exam: 'MPSC Rajyaseva GS',
    notesPurchased: 5,
    totalSpent: 595,
    registeredDate: '20 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-106',
    name: 'Vaishnavi More',
    email: 'vaishnavi.more@yahoo.in',
    phone: '+91 95451 88234',
    district: 'Satara (सातारा)',
    exam: 'Zilla Parishad Arogya Bharti',
    notesPurchased: 2,
    totalSpent: 238,
    registeredDate: '21 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-107',
    name: 'Ganesh Gaikwad',
    email: 'ganesh.gaikwad99@gmail.com',
    phone: '+91 91583 67120',
    district: 'Nagpur (नागपूर)',
    exam: 'Maharashtra Police Constable',
    notesPurchased: 1,
    totalSpent: 119,
    registeredDate: '22 Sep 2026',
    status: 'Active',
  },
  {
    id: 'STU-108',
    name: 'Madhuri Salunkhe',
    email: 'madhuri.salunkhe@gmail.com',
    phone: '+91 94056 44190',
    district: 'Solapur (सोलापूर)',
    exam: 'MPSC Group C Clerk Typist',
    notesPurchased: 3,
    totalSpent: 357,
    registeredDate: '23 Sep 2026',
    status: 'Active',
  },
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TXN-89412',
    studentName: 'Omkar Shinde',
    studentEmail: 'omkar.shinde@gmail.com',
    materialTitle: 'Maharashtra Geography & Physical Map Revision Book 2026',
    examCategory: 'MPSC',
    amount: 119,
    paymentMethod: 'UPI - PhonePe',
    timestamp: 'Today, 18:42 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89411',
    studentName: 'Priyanka Jadhav',
    studentEmail: 'priyanka.j@rediffmail.com',
    materialTitle: 'Modern History of Maharashtra & Social Reformers Compendium',
    examCategory: 'Combine',
    amount: 149,
    paymentMethod: 'UPI - GPay',
    timestamp: 'Today, 17:15 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89410',
    studentName: 'Akshay Patil',
    studentEmail: 'akshay.patil.mpsc@outlook.com',
    materialTitle: 'Indian Polity & Maharashtra Panchayat Raj Rapid Revision',
    examCategory: 'MPSC',
    amount: 129,
    paymentMethod: 'UPI - PhonePe',
    timestamp: 'Today, 16:04 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89409',
    studentName: 'Sneha Deshmukh',
    studentEmail: 'sneha.deshmukh24@gmail.com',
    materialTitle: 'Talathi Bharti TCS/IBPS 5000+ TCS Pattern PYQ & Formula Book',
    examCategory: 'Talathi',
    amount: 119,
    paymentMethod: 'Netbanking - SBI',
    timestamp: 'Today, 14:30 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89408',
    studentName: 'Rohan Kadam',
    studentEmail: 'rohan.kadam.upsc@gmail.com',
    materialTitle: 'Maharashtra Police Bharti General Knowledge & Special Law Notes',
    examCategory: 'Police Bharti',
    amount: 119,
    paymentMethod: 'UPI - GPay',
    timestamp: 'Today, 12:18 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89407',
    studentName: 'Vaishnavi More',
    studentEmail: 'vaishnavi.more@yahoo.in',
    materialTitle: 'Maharashtra Geography & Physical Map Revision Book 2026',
    examCategory: 'MPSC',
    amount: 119,
    paymentMethod: 'Debit Card',
    timestamp: 'Yesterday, 22:50 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89406',
    studentName: 'Ganesh Gaikwad',
    studentEmail: 'ganesh.gaikwad99@gmail.com',
    materialTitle: 'Economy, Agriculture & Budget Quick Summary Chart 2026',
    examCategory: 'Combine',
    amount: 139,
    paymentMethod: 'UPI - PhonePe',
    timestamp: 'Yesterday, 20:12 IST',
    status: 'Success',
  },
  {
    id: 'TXN-89405',
    studentName: 'Madhuri Salunkhe',
    studentEmail: 'madhuri.salunkhe@gmail.com',
    materialTitle: 'Modern History of Maharashtra & Social Reformers Compendium',
    examCategory: 'MPSC',
    amount: 149,
    paymentMethod: 'UPI - GPay',
    timestamp: 'Yesterday, 19:05 IST',
    status: 'Success',
  },
];

const INITIAL_LOGS: AuditLogRecord[] = [
  {
    id: 'LOG-501',
    timestamp: '2026-09-23 19:24:12 IST',
    level: 'AUTH',
    actor: 'superadmin',
    ip: '127.0.0.1',
    message: 'Superadmin session authenticated with 256-bit encryption key.',
  },
  {
    id: 'LOG-502',
    timestamp: '2026-09-23 19:18:04 IST',
    level: 'PAYMENT',
    actor: 'Razorpay Webhook',
    ip: '52.66.182.41',
    message: 'Payment TXN-89412 verified: ₹119 received from omkar.shinde@gmail.com.',
  },
  {
    id: 'LOG-503',
    timestamp: '2026-09-23 19:12:45 IST',
    level: 'SYSTEM',
    actor: 'Cron Runner',
    ip: 'internal',
    message: 'Study materials digital CDN sync completed. 0 cache anomalies.',
  },
  {
    id: 'LOG-504',
    timestamp: '2026-09-23 19:05:30 IST',
    level: 'SECURITY',
    actor: 'Shield Firewall',
    ip: 'internal',
    message: 'SSL certificates verified. Valid until 2027-09-23. Zero threat alerts.',
  },
  {
    id: 'LOG-505',
    timestamp: '2026-09-23 18:45:19 IST',
    level: 'PAYMENT',
    actor: 'Razorpay Webhook',
    ip: '52.66.182.41',
    message: 'Payment TXN-89411 verified: ₹149 received from priyanka.j@rediffmail.com.',
  },
  {
    id: 'LOG-506',
    timestamp: '2026-09-23 18:20:00 IST',
    level: 'SYSTEM',
    actor: 'Admin Console',
    ip: '127.0.0.1',
    message: 'Platform localized to English as default administrative language.',
  },
];

const MONTHLY_REVENUE_DATA = [
  { month: 'Apr', revenue: 248000, orders: 1980 },
  { month: 'May', revenue: 289400, orders: 2310 },
  { month: 'Jun', revenue: 312500, orders: 2540 },
  { month: 'Jul', revenue: 345000, orders: 2820 },
  { month: 'Aug', revenue: 372100, orders: 3010 },
  { month: 'Sep', revenue: 394850, orders: 3260 },
];

// Ashoka Stambha Seal Emblem (as used on the main navbar)
function NavbarSealEmblem({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'md' ? 'w-7 h-8' : 'w-6 h-7';
  return (
    <div className={`${dims} text-[#1C2C5B] shrink-0 opacity-90`}>
      <svg viewBox="0 0 100 125" fill="currentColor" className="w-full h-full drop-shadow-2xs">
        <circle cx="50" cy="50" r="46" fill="#1C2C5B" fillOpacity="0.08" stroke="#1C2C5B" strokeWidth="3" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="#1C2C5B" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="3" fill="#1C2C5B" />
        {Array.from({ length: 8 }).map((_, idx) => (
          <line
            key={idx}
            x1="50"
            y1="50"
            x2={50 + 13 * Math.cos((idx * Math.PI) / 4)}
            y2={50 + 13 * Math.sin((idx * Math.PI) / 4)}
            stroke="#1C2C5B"
            strokeWidth="2"
          />
        ))}
        <path d="M36 28 L50 16 L64 28 L58 35 L42 35 Z" fill="#1C2C5B" />
        <rect x="25" y="74" width="50" height="6" rx="2" fill="#1C2C5B" />
      </svg>
    </div>
  );
}

// =========================================================================
// MAIN SUPERADMIN COMPONENT
// =========================================================================
export default function SuperadminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard Navigation & Layout
  const [dashboardTab, setDashboardTab] = useState<
    'overview' | 'materials' | 'updates' | 'students' | 'revenue' | 'logs' | 'settings'
  >('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Live Data States
  const [materials, setMaterials] = useState(() => [...STUDY_MATERIALS_DATA]);
  const [updates, setUpdates] = useState(() => [...EXAM_UPDATES_DATA]);
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [logs, setLogs] = useState<AuditLogRecord[]>(INITIAL_LOGS);

  // Filters & Controls
  const [materialFilterCategory, setMaterialFilterCategory] = useState<string>('All');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('ALL');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');

  // Interactive Modals State
  const [activeModal, setActiveModal] = useState<
    null | 'add_material' | 'add_update' | 'edit_price' | 'view_student'
  >(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{ id: string; title: string; price: number } | null>(null);

  // Form states for adding items
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialExam, setNewMaterialExam] = useState('MPSC');
  const [newMaterialSubject, setNewMaterialSubject] = useState('General Studies');
  const [newMaterialPrice, setNewMaterialPrice] = useState('129');
  const [newMaterialPages, setNewMaterialPages] = useState('96');

  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateExam, setNewUpdateExam] = useState('MPSC');
  const [newUpdateBadge, setNewUpdateBadge] = useState('URGENT');
  const [newUpdateSummary, setNewUpdateSummary] = useState('');
  const [newUpdateLink, setNewUpdateLink] = useState('https://mpsc.gov.in');

  // Settings Toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [watermarkingEnabled, setWatermarkingEnabled] = useState(true);
  const [razorpayLive, setRazorpayLive] = useState(true);
  const [isPurgingCache, setIsPurgingCache] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Check saved session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('chai_superadmin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      const savedUser = localStorage.getItem('chai_superadmin_user');
      if (savedUser) setUsername(savedUser);
    }
  }, []);

  // Monitor CapsLock key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter Superadmin Username or Email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const isValidUser =
        username.toLowerCase() === 'superadmin@chairevision.com' ||
        username.toLowerCase() === 'superadmin' ||
        username.toLowerCase() === 'admin';
      const isValidPass =
        password === 'ChaiSuperAdmin#2026' ||
        password === 'admin123' ||
        password === 'superadmin';

      if (isValidUser && isValidPass) {
        setIsLoading(false);
        setSuccessMsg('Authentication successful! Entering Admin Console...');
        if (rememberMe) {
          localStorage.setItem('chai_superadmin_auth', 'true');
          localStorage.setItem('chai_superadmin_user', username);
        }
        setTimeout(() => {
          setIsAuthenticated(true);
          setSuccessMsg('');
          showToast(`Welcome back, ${username || 'Superadmin'}! Session active.`, 'success');
        }, 600);
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid Superadmin credentials. Please verify your details.');
      }
    }, 750);
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('chai_superadmin_auth');
    localStorage.removeItem('chai_superadmin_user');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setAdminPin('');
    setErrorMsg('');
    setSuccessMsg('');
    showToast('Signed out of Superadmin Console successfully.', 'info');
  };

  // Add New Material Action
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) {
      showToast('Please provide a title for the study notes.', 'error');
      return;
    }

    const priceNum = parseInt(newMaterialPrice, 10) || 119;
    const pagesNum = parseInt(newMaterialPages, 10) || 80;

    const newMatItem = {
      id: `mat-${Date.now()}`,
      slug: newMaterialTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: {
        en: newMaterialTitle,
        mr: newMaterialTitle,
        hi: newMaterialTitle,
      },
      subtitle: {
        en: `${newMaterialExam} • ${newMaterialSubject} Revision Notes 2026`,
        mr: `${newMaterialExam} • ${newMaterialSubject} रिव्हिजन नोट्स`,
        hi: `${newMaterialExam} • ${newMaterialSubject} रिवीजन नोट्स`,
      },
      description: {
        en: `High-yield concise revision notes compiled for Maharashtra aspirants preparing for ${newMaterialExam}.`,
        mr: `महाराष्ट्र स्पर्धा परीक्षेसाठी विशेष रिव्हिजन डिजिटल नोट्स.`,
        hi: `महाराष्ट्र प्रतियोगी परीक्षा के लिए विशेष रिवीजन डिजिटल नोट्स.`,
      },
      exam: newMaterialExam,
      subject: newMaterialSubject,
      language: 'Marathi',
      materialType: 'Short Notes',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      samplePages: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
      pages: pagesNum,
      originalPrice: priceNum + 100,
      discountedPrice: priceNum,
      rating: 4.9,
      reviewsCount: 14,
      lastUpdated: 'Today',
      featured: true,
      bestseller: false,
      fileSize: '14.2 MB',
      tableOfContents: ['1. Core Concepts & Overview', '2. Solved Question Set', '3. Important Summary Points'],
      whatIsIncluded: ['High Resolution Digital PDF', 'Instant Download', 'Revision Formula Sheet'],
      tags: [newMaterialExam, newMaterialSubject, 'Maharashtra', 'Notes'],
    };

    setMaterials([newMatItem as any, ...materials]);
    setActiveModal(null);
    setNewMaterialTitle('');
    showToast(`"${newMaterialTitle}" added to Study Materials catalog!`, 'success');
  };

  // Quick Price Update Action
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setMaterials((prev) =>
      prev.map((item) =>
        item.id === editingMaterial.id
          ? { ...item, discountedPrice: editingMaterial.price }
          : item
      )
    );
    setActiveModal(null);
    showToast(`Price updated to ₹${editingMaterial.price} successfully!`, 'success');
  };

  // Add New Circular Action
  const handleCreateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateTitle.trim()) {
      showToast('Please provide a circular title.', 'error');
      return;
    }

    const newUpdateItem = {
      id: `upd-${Date.now()}`,
      title: {
        en: newUpdateTitle,
        mr: newUpdateTitle,
        hi: newUpdateTitle,
      },
      exam: newUpdateExam,
      badge: newUpdateBadge,
      publishedDate: 'Today',
      shortSummary: {
        en: newUpdateSummary || 'Important official announcement published by Maharashtra authority.',
        mr: newUpdateSummary || 'महाराष्ट्र स्पर्धा परीक्षा अधिकृत परिपत्रक प्रसिद्ध.',
        hi: newUpdateSummary || 'महाराष्ट्र प्रतियोगी परीक्षा आधिकारिक सूचना जारी.',
      },
      officialLink: newUpdateLink || 'https://mpsc.gov.in',
      isNew: true,
    };

    setUpdates([newUpdateItem as any, ...updates]);
    setActiveModal(null);
    setNewUpdateTitle('');
    setNewUpdateSummary('');
    showToast(`Circular "${newUpdateTitle}" broadcasted to students!`, 'success');
  };

  // Delete Material Handler
  const handleDeleteMaterial = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}"?`)) {
      setMaterials((prev) => prev.filter((item) => item.id !== id));
      showToast(`Item removed from catalog.`, 'info');
    }
  };

  // Delete Circular Handler
  const handleDeleteUpdate = (id: string) => {
    setUpdates((prev) => prev.filter((item) => item.id !== id));
    showToast(`Circular removed.`, 'info');
  };

  // Export Financial CSV Action
  const handleExportCSV = () => {
    const headers = 'Transaction ID,Student Name,Email,Material Title,Category,Amount (INR),Payment Method,Date,Status\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.studentName}","${t.studentEmail}","${t.materialTitle}","${t.examCategory}",${t.amount},"${t.paymentMethod}","${t.timestamp}","${t.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chai_revision_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial transactions exported to CSV successfully.', 'success');
  };

  // Cache Purge Action
  const handlePurgeCache = () => {
    setIsPurgingCache(true);
    setTimeout(() => {
      setIsPurgingCache(false);
      showToast('Edge cache purged across Mumbai & Pune Cloudflare CDN nodes!', 'success');
    }, 1200);
  };

  // Copy Logs Action
  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.actor}] (${l.ip}): ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('Audit logs copied to clipboard!', 'info');
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const title = (item.title?.en || item.title?.mr || '').toLowerCase();
      const exam = (item.exam || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const query = globalSearch.toLowerCase();

      const matchesSearch =
        !query || title.includes(query) || exam.includes(query) || subject.includes(query);

      const matchesCategory =
        materialFilterCategory === 'All' ||
        item.exam.toLowerCase().includes(materialFilterCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [materials, globalSearch, materialFilterCategory]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (logLevelFilter !== 'ALL' && log.level !== logLevelFilter) return false;
      if (globalSearch) {
        return (
          log.message.toLowerCase().includes(globalSearch.toLowerCase()) ||
          log.actor.toLowerCase().includes(globalSearch.toLowerCase())
        );
      }
      return true;
    });
  }, [logs, logLevelFilter, globalSearch]);

  // =========================================================================
  // VIEW: AUTHENTICATED SUPERADMIN COMMAND CENTER (PROFESSIONAL UI/UX)
  // =========================================================================
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-['Poppins',sans-serif] selection:bg-blue-100 selection:text-blue-900 relative">
        {/* =================================================================== */}
        {/* LEFT EXECUTIVE SIDEBAR */}
        {/* =================================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } hidden lg:flex shadow-xs`}
        >
          {/* Top Brand Header */}
          <div>
            <div className="h-16 border-b border-slate-200/80 px-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
                <NavbarSealEmblem size="sm" />
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-px bg-slate-200" />
                    <ChaiLogo variant="dark" size="sm" showTagline={false} />
                  </div>
                )}
              </Link>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Groups */}
            <div className="p-3 space-y-6">
              {/* Core Section */}
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Core Operations
                  </div>
                )}

                <button
                  onClick={() => setDashboardTab('overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'overview'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="System Overview"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Overview & KPI</span>}
                </button>

                <button
                  onClick={() => setDashboardTab('materials')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'materials'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Study Materials"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Study Materials</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        dashboardTab === 'materials' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {materials.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setDashboardTab('updates')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'updates'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Exam Circulars"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Exam Circulars</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        dashboardTab === 'updates' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {updates.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Management Section */}
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Management
                  </div>
                )}

                <button
                  onClick={() => setDashboardTab('students')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'students'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Student Aspirants"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Aspirants Directory</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        dashboardTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      54k+
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setDashboardTab('revenue')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'revenue'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Revenue & Ledger"
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Revenue & Ledger</span>}
                </button>
              </div>

              {/* System Section */}
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    System & Security
                  </div>
                )}

                <button
                  onClick={() => setDashboardTab('logs')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'logs'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Security Logs"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Audit & Security Logs</span>}
                </button>

                <button
                  onClick={() => setDashboardTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dashboardTab === 'settings'
                      ? 'bg-[#1C2C5B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Platform Settings</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Administrator Profile Card */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#1C2C5B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  SA
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">Super Administrator</p>
                    <p className="text-[10px] text-slate-400 truncate">superadmin@chairevision.com</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* MOBILE DRAWER OVERLAY */}
        {/* =================================================================== */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 max-w-[85vw] h-full bg-white shadow-2xl p-4 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <NavbarSealEmblem size="sm" />
                    <ChaiLogo variant="dark" size="sm" showTagline={false} />
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-1.5">
                  <button
                    onClick={() => {
                      setDashboardTab('overview');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('materials');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Study Materials ({materials.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('updates');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Exam Circulars ({updates.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('students');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Users className="w-4 h-4" />
                    <span>Aspirants Directory</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('revenue');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Revenue & Ledger</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('logs');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab('settings');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Platform Settings</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MAIN CONTENT AREA */}
        {/* =================================================================== */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Top Executive Header Bar */}
          <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4 shadow-2xs">
            {/* Left Header: Mobile Toggle & Search */}
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Quick Search */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search students, notes, circulars, or logs..."
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-['Poppins',sans-serif]"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Add Button */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setActiveModal('add_material')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Material</span>
                </button>
              </div>

              {/* Cluster Status Badge */}
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Production OK (28ms)</span>
              </div>

              {/* Public Website External Link */}
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-2xs font-medium"
                title="Open Public Website in New Tab"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </header>

          {/* ================================================================= */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ================================================================= */}
          {dashboardTab === 'overview' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              {/* Welcome Banner */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider font-mono">
                      Operations Live
                    </span>
                    <span className="text-xs text-slate-400">• September 2026</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E2653] tracking-tight">
                    Executive Command Center
                  </h1>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of Maharashtra competitive exam notes, student registrations, and revenue.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveModal('add_update')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-700" />
                    <span>Post Circular</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('add_material')}
                    className="px-3.5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Study Material</span>
                  </button>
                </div>
              </div>

              {/* 4 Interactive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Enrolled Aspirants</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1E2653]">54,280+</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+14.2% vs previous month</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Digital Notes Sold</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1E2653]">186,420</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+22.5% active reader sessions</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Gross Revenue (Sep)</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700">₹ 3,94,850</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      99.9% UPI success rate
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>System Health</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Server className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1E2653]">100% Uptime</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      PostgreSQL 15 • Latency 14ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue & Growth Visualizer */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E2653]">Revenue & Order Velocity (FY 2026)</h3>
                    <p className="text-xs text-slate-500">
                      Monthly gross revenue trends across Maharashtra competitive examinations.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setChartMetric('revenue')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartMetric === 'revenue' ? 'bg-white text-[#1C2C5B] shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Revenue (₹)
                    </button>
                    <button
                      onClick={() => setChartMetric('orders')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartMetric === 'orders' ? 'bg-white text-[#1C2C5B] shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Notes Sold (Units)
                    </button>
                  </div>
                </div>

                {/* Interactive CSS Bar Visualizer */}
                <div className="grid grid-cols-6 gap-2 sm:gap-6 pt-6 pb-2 items-end h-48 border-b border-slate-100">
                  {MONTHLY_REVENUE_DATA.map((item) => {
                    const maxVal = chartMetric === 'revenue' ? 420000 : 3500;
                    const curVal = chartMetric === 'revenue' ? item.revenue : item.orders;
                    const heightPercent = Math.min(100, Math.round((curVal / maxVal) * 100));

                    return (
                      <div key={item.month} className="flex flex-col items-center gap-2 group h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap mb-1">
                          {chartMetric === 'revenue' ? `₹${(item.revenue / 1000).toFixed(1)}k` : `${item.orders} units`}
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full max-w-[48px] bg-gradient-to-t from-[#1C2C5B] to-blue-600 rounded-t-xl transition-all duration-500 group-hover:from-blue-700 group-hover:to-blue-500 shadow-xs"
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* Month Label */}
                        <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Grid: Top Selling Notes & Live Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Materials */}
                <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Best Selling Study Notes</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Ranked by overall downloads and student reviews</p>
                    </div>
                    <button
                      onClick={() => setDashboardTab('materials')}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                    >
                      View All ({materials.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {materials.slice(0, 5).map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.title?.en || item.title?.mr}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-xs font-medium">
                              {item.exam}
                            </span>
                            <span>•</span>
                            <span>{item.subject}</span>
                            <span>•</span>
                            <span>{item.pages} pgs</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-emerald-700 font-mono">₹{item.discountedPrice}</span>
                          <button
                            onClick={() => {
                              setEditingMaterial({
                                id: item.id,
                                title: item.title?.en || item.title?.mr,
                                price: item.discountedPrice,
                              });
                              setActiveModal('edit_price');
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Price"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1E2653] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>Live Activity Feed</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Recent student enrollments and downloads</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((txn) => (
                      <div
                        key={txn.id}
                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{txn.studentName}</span>
                          <span className="font-bold text-emerald-700 font-mono">₹{txn.amount}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{txn.materialTitle}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>{txn.paymentMethod}</span>
                          <span>{txn.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 2: STUDY MATERIALS MANAGEMENT */}
          {/* ================================================================= */}
          {dashboardTab === 'materials' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              {/* Header with Title and Add Button */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#1E2653]">Study Materials Directory</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage digital revision books, prices, exam tags, and inventory.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setActiveModal('add_material')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Material</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'MPSC', 'Combine', 'Police Bharti', 'Talathi', 'Saralseva'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMaterialFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      materialFilterCategory === cat
                        ? 'bg-[#1C2C5B] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <span className="text-xs text-slate-400 font-mono ml-auto">
                  Showing {filteredMaterials.length} of {materials.length} titles
                </span>
              </div>

              {/* Materials Data Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Title & Subject</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Pages</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Rating</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMaterials.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                            <div className="truncate">{item.title?.en || item.title?.mr}</div>
                            <div className="text-[11px] text-slate-400 font-normal font-sans">{item.subject}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-medium">
                              {item.exam}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{item.pages} pgs</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            ₹{item.discountedPrice}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-amber-600 font-semibold">{item.rating} ★</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingMaterial({
                                  id: item.id,
                                  title: item.title?.en || item.title?.mr,
                                  price: item.discountedPrice,
                                });
                                setActiveModal('edit_price');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Price"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMaterial(item.id, item.title?.en || item.title?.mr)
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 3: EXAM CIRCULARS & NOTIFICATIONS */}
          {/* ================================================================= */}
          {dashboardTab === 'updates' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#1E2653]">Exam Circulars & Broadcasts</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage notifications, Hall Ticket alerts, and official government exam circulars.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('add_update')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Broadcast New Circular</span>
                </button>
              </div>

              <div className="space-y-3">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase font-mono">
                          {update.badge}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">{update.exam}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400 font-mono">{update.publishedDate}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {update.title?.en || update.title?.mr}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {update.shortSummary?.en || update.shortSummary?.mr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={update.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors shadow-2xs font-medium"
                      >
                        Official Portal ↗
                      </a>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 4: STUDENT ASPIRANTS DIRECTORY */}
          {/* ================================================================= */}
          {dashboardTab === 'students' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#1E2653]">Aspirants Directory</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Registered candidates preparing across Maharashtra districts.
                  </p>
                </div>
                <div className="text-xs font-mono text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-semibold">
                  Total Active: 54,280+ Students
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Target Exam</th>
                        <th className="py-3 px-4">Notes Purchased</th>
                        <th className="py-3 px-4">Total Spent</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{student.email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{student.district}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-medium">
                              {student.exam}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                            {student.notesPurchased} books
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">₹{student.totalSpent}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{student.registeredDate}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setActiveModal('view_student');
                              }}
                              className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer font-semibold"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 5: REVENUE & LEDGER */}
          {/* ================================================================= */}
          {dashboardTab === 'revenue' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#1E2653]">Revenue & Transaction Ledger</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Instant settlements, UPI payments, and digital notes invoices.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2C5B] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>

              {/* Transactions Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Study Material</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{txn.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{txn.studentName}</td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">{txn.materialTitle}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{txn.paymentMethod}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">₹{txn.amount}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{txn.timestamp}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-semibold">
                              ✓ {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 6: AUDIT & SECURITY LOGS */}
          {/* ================================================================= */}
          {dashboardTab === 'logs' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[#1E2653]">Audit & Security Logs</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Immutable event streams, payment webhooks, and administrative actions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </button>
                </div>
              </div>

              {/* Log Level Filters */}
              <div className="flex items-center gap-2">
                {['ALL', 'AUTH', 'PAYMENT', 'SYSTEM', 'SECURITY'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono ${
                      logLevelFilter === lvl
                        ? 'bg-[#1C2C5B] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Terminal View */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400 text-[11px]">
                  <span>Console Stream • /var/log/chai_audit.log</span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Streaming Live
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1">
                      <span className="text-slate-500 shrink-0 text-[11px]">{log.timestamp}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-xs font-bold shrink-0 ${
                          log.level === 'SECURITY'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : log.level === 'PAYMENT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : log.level === 'AUTH'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        [{log.level}]
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          )}

          {/* ================================================================= */}
          {/* TAB 7: PLATFORM SETTINGS */}
          {/* ================================================================= */}
          {dashboardTab === 'settings' && (
            <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-4xl">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <h1 className="text-xl font-bold text-[#1E2653]">Platform Configuration</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Global controls, payment credentials, and student security policies.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Maintenance Mode</h4>
                      <p className="text-[11px] text-slate-500">Temporarily redirect public traffic to maintenance screen.</p>
                    </div>
                    <button
                      onClick={() => {
                        setMaintenanceMode(!maintenanceMode);
                        showToast(`Maintenance mode ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}.`, 'info');
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        maintenanceMode ? 'bg-amber-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          maintenanceMode ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Watermarking */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Digital Notes Dynamic Watermarking</h4>
                      <p className="text-[11px] text-slate-500">
                        Embed aspirant phone number and transaction ID on PDF pages to prevent piracy.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setWatermarkingEnabled(!watermarkingEnabled);
                        showToast(`PDF Watermarking ${!watermarkingEnabled ? 'ENABLED' : 'DISABLED'}.`, 'success');
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        watermarkingEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          watermarkingEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Razorpay Gateway */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Razorpay Production Gateway</h4>
                      <p className="text-[11px] text-slate-500">Live payment settlement via UPI, QR, and Netbanking.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                      ✓ LIVE ACTIVE
                    </span>
                  </div>

                  {/* Cache Purge */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cloudflare Edge Cache</h4>
                      <p className="text-[11px] text-slate-500">Purge HTML & static JSON across Mumbai and Pune PoPs.</p>
                    </div>
                    <button
                      onClick={handlePurgeCache}
                      disabled={isPurgingCache}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPurgingCache ? 'animate-spin' : ''}`} />
                      <span>{isPurgingCache ? 'Purging...' : 'Purge Cache'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </main>
          )}
        </div>

        {/* =================================================================== */}
        {/* INTERACTIVE MODAL: ADD STUDY MATERIAL */}
        {/* =================================================================== */}
        {activeModal === 'add_material' && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#1E2653] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Add Study Material</span>
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMaterial} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Notes Title (English)</label>
                  <input
                    type="text"
                    required
                    value={newMaterialTitle}
                    onChange={(e) => setNewMaterialTitle(e.target.value)}
                    placeholder="e.g. MPSC Economics & Budget High-Speed Revision"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Exam Category</label>
                    <select
                      value={newMaterialExam}
                      onChange={(e) => setNewMaterialExam(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="MPSC">MPSC Rajyaseva</option>
                      <option value="Combine">Combine (PSI/STI/ASO)</option>
                      <option value="Police Bharti">Police Bharti</option>
                      <option value="Talathi">Talathi Bharti</option>
                      <option value="Saralseva">Saralseva / ZP</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Subject</label>
                    <input
                      type="text"
                      required
                      value={newMaterialSubject}
                      onChange={(e) => setNewMaterialSubject(e.target.value)}
                      placeholder="e.g. Geography / Law"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={newMaterialPrice}
                      onChange={(e) => setNewMaterialPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Page Count</label>
                    <input
                      type="number"
                      required
                      value={newMaterialPages}
                      onChange={(e) => setNewMaterialPages(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Publish Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE MODAL: QUICK PRICE EDIT */}
        {/* =================================================================== */}
        {activeModal === 'edit_price' && editingMaterial && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#1E2653]">Update Material Price</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrice} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium truncate">{editingMaterial.title}</p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">New Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingMaterial.price}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-700 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE MODAL: ADD CIRCULAR */}
        {/* =================================================================== */}
        {activeModal === 'add_update' && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#1E2653] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-700" />
                  <span>Broadcast Exam Circular</span>
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUpdate} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Circular Headline</label>
                  <input
                    type="text"
                    required
                    value={newUpdateTitle}
                    onChange={(e) => setNewUpdateTitle(e.target.value)}
                    placeholder="e.g. MPSC Rajyaseva 2026 Hall Ticket Download Link Activated"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Exam Body</label>
                    <input
                      type="text"
                      required
                      value={newUpdateExam}
                      onChange={(e) => setNewUpdateExam(e.target.value)}
                      placeholder="MPSC / Police / ZP"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Badge Label</label>
                    <select
                      value={newUpdateBadge}
                      onChange={(e) => setNewUpdateBadge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                    >
                      <option value="URGENT">URGENT</option>
                      <option value="NEW">NEW</option>
                      <option value="IMPORTANT">IMPORTANT</option>
                      <option value="SYLLABUS">SYLLABUS</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Short Summary</label>
                  <textarea
                    rows={2}
                    value={newUpdateSummary}
                    onChange={(e) => setNewUpdateSummary(e.target.value)}
                    placeholder="Brief explanation for students..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Official Link URL</label>
                  <input
                    type="url"
                    value={newUpdateLink}
                    onChange={(e) => setNewUpdateLink(e.target.value)}
                    placeholder="https://mpsc.gov.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Broadcast Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE MODAL: VIEW STUDENT */}
        {/* =================================================================== */}
        {activeModal === 'view_student' && selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#1E2653] flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-700" />
                  <span>Aspirant Profile</span>
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1C2C5B] flex items-center justify-center text-base font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedStudent.name}</h4>
                    <p className="text-slate-400 font-mono">{selectedStudent.email}</p>
                    <p className="text-slate-400 font-mono">{selectedStudent.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">District</span>
                    <p className="font-semibold text-slate-800">{selectedStudent.district}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Exam</span>
                    <p className="font-semibold text-blue-800">{selectedStudent.exam}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Notes Purchased</span>
                    <p className="font-bold text-slate-900 font-mono">{selectedStudent.notesPurchased} Books</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Contribution</span>
                    <p className="font-bold text-emerald-700 font-mono">₹{selectedStudent.totalSpent}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-xl bg-[#1C2C5B] text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* FLOATING TOAST NOTIFICATION */}
        {/* =================================================================== */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div
              className={`px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold text-slate-900 bg-white ${
                toast.type === 'success'
                  ? 'border-emerald-200 shadow-emerald-500/10'
                  : toast.type === 'error'
                  ? 'border-rose-200 shadow-rose-500/10'
                  : 'border-blue-200 shadow-blue-500/10'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{toast.text}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: SUPERADMIN LOGIN PORTAL (LIGHT MODE + POPPINS FONT + NAVBAR LOGO)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden font-['Poppins',sans-serif]">
      {/* Background Soft Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-100/60 via-purple-100/40 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-pink-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-0"
        style={{
          backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Navbar Minimal with Exact Navbar Logo */}
      <header className="relative z-10 px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3.5 transition-transform hover:scale-[1.01]">
          {/* Government seal emblem badge (same as navbar) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <NavbarSealEmblem size="sm" />
            <div className="h-6 w-px bg-slate-200/90" />
          </div>

          {/* ChaiLogo (same as navbar) */}
          <ChaiLogo variant="dark" size="sm" showTagline={false} />

          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
            SUPERADMIN
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-all font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Main Website</span>
        </Link>
      </header>

      {/* Center Login Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Superadmin Card Header with Central Navbar Brand Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center items-center gap-3">
              <NavbarSealEmblem size="md" />
              <div className="h-8 w-px bg-slate-200" />
              <ChaiLogo variant="dark" size="md" showTagline={false} />
            </div>

            <div className="pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2653] tracking-tight">
                Sign In to Command Center
              </h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5 relative">
            {/* Error & Success Feedback Banners */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Superadmin Username or Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin@chairevision.com"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all shadow-2xs font-['Poppins',sans-serif]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Security Password <span className="text-rose-500">*</span>
                  </label>
                  {capsLockActive && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-mono font-medium">
                      <span>⚠ CapsLock is ON</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional 2FA PIN / Passkey */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-slate-600">
                  Admin Security PIN <span className="text-slate-400 text-[10px]">(Optional / 4-Digit)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="e.g. 9821"
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-blue-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1C2C5B] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/20 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2 font-['Poppins',sans-serif]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Sign In to Superadmin Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p>© 2026 Chai Revision. All rights reserved.</p>
      </footer>
    </div>
  );
}
