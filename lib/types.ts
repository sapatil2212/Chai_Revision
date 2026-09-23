export type Language = 'mr' | 'en' | 'hi';

export type ExamCategory = 
  | 'MPSC'
  | 'Arogya Bharti'
  | 'PSI'
  | 'STI'
  | 'ASO'
  | 'Talathi'
  | 'Police Bharti'
  | 'TET / TAIT'
  | 'सरळसेवा'
  | 'Forest Service';

export type Subject = 
  | 'Polity & Constitution'
  | 'Maharashtra & Indian History'
  | 'Maharashtra & World Geography'
  | 'Indian Economy'
  | 'General Science'
  | 'CSAT & Reasoning'
  | 'Marathi Grammar'
  | 'English Grammar'
  | 'Current Affairs'
  | 'Environment & Ecology';

export type MaterialType = 
  | 'PDF Notes'
  | 'Short Notes'
  | 'Revision Notes'
  | 'Yearbooks'
  | 'PYQ Books'
  | 'Practice Papers'
  | 'Question Banks'
  | 'Current Affairs'
  | 'Study Guides';

export interface Product {
  id: string;
  slug: string;
  title: {
    mr: string;
    en: string;
    hi: string;
  };
  subtitle?: {
    mr: string;
    en: string;
    hi: string;
  };
  description: {
    mr: string;
    en: string;
    hi: string;
  };
  exam: ExamCategory;
  subject: Subject;
  language: 'Marathi' | 'English' | 'Bilingual' | 'Hindi';
  materialType: MaterialType;
  coverImage: string;
  samplePages: string[];
  pages: number;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviewsCount: number;
  lastUpdated: string;
  featured?: boolean;
  bestseller?: boolean;
  isFree?: boolean;
  fileSize: string;
  tableOfContents: string[];
  whatIsIncluded: string[];
  tags: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: {
    mr: string;
    en: string;
    hi: string;
  };
  exam: ExamCategory;
  instructor: {
    name: string;
    role: string;
    experience: string;
    avatar: string;
  };
  language: string;
  duration: string;
  type: 'Live + Recorded' | 'Recorded HD' | 'Crash Course';
  validity: string;
  rating: number;
  enrolledCount: number;
  originalPrice: number;
  discountedPrice: number;
  coverImage: string;
  modules: {
    title: string;
    lessons: number;
    hours: string;
  }[];
  whatYouWillLearn: string[];
}

export interface PYQItem {
  id: string;
  exam: ExamCategory;
  year: number;
  subject: Subject;
  topic: string;
  question: {
    mr: string;
    en: string;
    hi: string;
  };
  options: {
    id: number;
    text: {
      mr: string;
      en: string;
      hi: string;
    };
  }[];
  correctOption: number;
  explanation: {
    mr: string;
    en: string;
    hi: string;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type UpdateCategory = 
  | 'Exam Forms'
  | 'Exam Notifications'
  | 'Admit Card'
  | 'Results'
  | 'Answer Keys'
  | 'Recruitment'
  | 'Important Dates';

export type UpdateBadge = 'NEW' | 'IMPORTANT' | 'LAST DATE' | 'ADMIT CARD' | 'RESULT';

export interface ExamUpdate {
  id: string;
  slug: string;
  title: {
    mr: string;
    en: string;
    hi: string;
  };
  exam: ExamCategory;
  category: UpdateCategory;
  badge: UpdateBadge;
  publishedDate: string;
  lastDate?: string;
  examDate?: string;
  shortSummary: {
    mr: string;
    en: string;
    hi: string;
  };
  fullContent: {
    mr: string;
    en: string;
    hi: string;
  };
  officialLink: string;
  syllabusLink?: string;
}

export interface ImportantDateItem {
  id: string;
  exam: ExamCategory;
  event: {
    mr: string;
    en: string;
    hi: string;
  };
  startDate: string;
  lastDate: string;
  status: 'Upcoming' | 'Active' | 'Closing Soon' | 'Completed';
  category: 'Form' | 'Admit Card' | 'Exam' | 'Result';
}

export interface CurrentAffairItem {
  id: string;
  title: {
    mr: string;
    en: string;
    hi: string;
  };
  category: 'National' | 'Maharashtra' | 'Economy' | 'Science & Tech' | 'Sports' | 'Awards';
  date: string;
  summary: {
    mr: string;
    en: string;
    hi: string;
  };
  points: {
    mr: string[];
    en: string[];
    hi: string[];
  };
  mcqQuestion?: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  };
}

export interface BlogPost {
  id: string;
  slug: string;
  title: {
    mr: string;
    en: string;
    hi: string;
  };
  excerpt: {
    mr: string;
    en: string;
    hi: string;
  };
  content: {
    mr: string;
    en: string;
    hi: string;
  };
  category: 'MPSC Preparation' | 'Study Strategy' | 'Current Affairs' | 'Exam Strategy' | 'Career Guidance';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedDate: string;
  readingTime: string;
  coverImage: string;
  tableOfContents: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: Product[];
  totalAmount: number;
  status: 'Completed' | 'Processing';
  paymentId: string;
  paymentMethod: string;
  downloadToken: string;
  tokenExpiresAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'material' | 'exam' | 'system' | 'discount';
  read: boolean;
  link?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  preferredLanguage: Language;
  targetExams: ExamCategory[];
  avatar: string;
  joinedDate: string;
}
