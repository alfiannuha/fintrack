export interface User {
  _id: string;
  wallet_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Wallet {
  _id: string;
  code: string;
  name: string;
  created_by: string;
  members: string[];
  created_at: string;
}

export interface Transaction {
  _id: string;
  wallet_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note?: string;
  is_recurring?: boolean;
  merchant_name?: string;
  created_at: string;
  category?: Category;
}

export interface Category {
  _id: string;
  wallet_id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_default: boolean;
}

export interface Budget {
  _id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  period: 'monthly';
  month: string;
  category?: Category;
  spent?: number;
  progress?: number;
}

export interface RecurringRule {
  _id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  note?: string;
  day_of_month: number;
  is_active: boolean;
  last_run_at?: string;
  category?: Category;
}

export interface Insight {
  type: 'warning' | 'info' | 'success' | 'anomaly';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  month: string;
}

export interface DailyChartData {
  date: string;
  income: number;
  expense: number;
}

export interface CategoryChartData {
  category: string;
  amount: number;
  color?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JoinInput {
  code: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export interface MonthlyReport {
  month: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
  transaction_count: number;
  categories: CategoryBreakdown[];
  daily_totals: DailyChartData[];
  top_expenses: TopExpense[];
  savings_rate: number;
  previous_month_comparison: MonthComparison;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface TopExpense {
  category_id: string;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
}

export interface MonthComparison {
  income_change: number;
  income_change_percent: number;
  expense_change: number;
  expense_change_percent: number;
}
