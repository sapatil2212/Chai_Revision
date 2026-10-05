// Client helper for the superadmin dashboard stats.
import { request } from './adminApi';

export type ActivityKind = 'attempt' | 'material' | 'update' | 'pyq' | 'quiz';

export interface ActivityItem {
  kind: ActivityKind;
  title: string;
  subtitle: string;
  at: string;
  value?: string;
}

export interface UpcomingItem {
  kind: 'quiz-opens' | 'quiz-closes' | 'exam-date';
  title: string;
  subtitle: string;
  at: string | null;
  label: string;
}

export interface DashboardStats {
  materials: { total: number; published: number; drafts: number; free: number; withFile: number; downloads: number };
  pyqs: { total: number; published: number; years: number };
  quizzes: { total: number; published: number; questions: number };
  updates: { total: number; published: number };
  attempts: {
    total: number;
    submitted: number;
    inProgress: number;
    last7Days: number;
    avgPercentage: number;
    passRate: number;
  };
  students: { total: number; activeLast7Days: number };
  revenue: { orders: number; paidOrders: number; rupees: number; last7DaysRupees: number; live: boolean };
  trend: { date: string; attempts: number; students: number }[];
  recent: ActivityItem[];
  upcoming: UpcomingItem[];
  visitors: {
    totalViews: number;
    uniqueVisitors: number;
    todayViews: number;
    todayVisitors: number;
    last7DaysViews: number;
    daily: { date: string; views: number; visitors: number }[];
    topPages: { path: string; views: number; visitors: number }[];
    devices: { type: string; count: number }[];
    browsers: { name: string; count: number }[];
    operatingSystems: { name: string; count: number }[];
    referrers: { source: string; count: number }[];
  };
  generatedAt: string;
  trendDays: number;
}

export const statsAdminApi = {
  get: () => request<DashboardStats>('/api/admin/stats'),
};
