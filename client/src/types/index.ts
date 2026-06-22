export interface Order {
  id: number;
  order_number: string;
  city: string;
  area: string;
  street: string;
  value: number;
  customer_phone: string;
  delivery_company: string;
  occasion: string;
  notes: string;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface StatsSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export interface AreaStat {
  area: string;
  city: string;
  count: number;
  revenue: number;
}

export interface DayStat {
  date: string;
  orders: number;
  revenue: number;
}

export interface OccasionStat {
  occasion: string;
  count: number;
  revenue: number;
}

export interface RepeatCustomer {
  customer_phone: string;
  orderCount: number;
  totalSpent: number;
}

export interface DashboardStats {
  summary: StatsSummary;
  byArea: AreaStat[];
  byDay: DayStat[];
  byOccasion: OccasionStat[];
  repeatCustomers: RepeatCustomer[];
}

export interface CreateOrderPayload {
  location: string;
  value: number;
  customerPhone: string;
  occasion?: string;
  notes?: string;
}

export type StoreVisitOutcome = 'bought' | 'no_buy';

export type NoBuyReason = 'browsing' | 'price' | 'not_found' | 'come_back' | 'other';

export interface StoreVisit {
  id: number;
  outcome: StoreVisitOutcome;
  value: number | null;
  reason: string | null;
  created_at: string;
}

export interface StoreTodayLog {
  visits: StoreVisit[];
}

export interface StoreReasonStat {
  reason: string;
  count: number;
}

export interface StoreHourStat {
  hour: string;
  visitors: number;
  buyers: number;
  revenue: number;
}

export interface StoreHistoryDay {
  date: string;
  totalVisitors: number;
  totalBuyers: number;
  revenue: number;
  hours: { hour: string; visits: StoreVisit[] }[];
}

export interface StoreHistory {
  days: StoreHistoryDay[];
}

export interface StoreTodayStats {
  totalVisitors: number;
  totalBuyers: number;
  conversionRate: number;
  revenueToday: number;
  avgOrderValue: number;
  noBuyCount: number;
  noBuyRate: number;
  byReason: StoreReasonStat[];
  byHour: StoreHourStat[];
}

export interface CreateStoreVisitPayload {
  outcome: StoreVisitOutcome;
  value?: number;
  reason?: NoBuyReason;
  customReason?: string;
}

export interface UpdateStoreVisitPayload {
  outcome?: StoreVisitOutcome;
  value?: number;
  reason?: NoBuyReason;
  customReason?: string;
  created_at?: string;
}
