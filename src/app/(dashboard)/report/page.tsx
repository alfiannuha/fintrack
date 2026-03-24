'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getPreviousMonth, getNextMonth, getMonthName } from '@/lib/utils';
import { toast } from 'sonner';

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

interface TopExpense {
  category_id: string;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
}

interface MonthComparison {
  income_change: number;
  income_change_percent: number;
  expense_change: number;
  expense_change_percent: number;
}

interface MonthlyReport {
  month: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
  transaction_count: number;
  categories: CategoryBreakdown[];
  daily_totals: DailyTotal[];
  top_expenses: TopExpense[];
  savings_rate: number;
  previous_month_comparison: MonthComparison;
}

export default function ReportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadReport();
    }
  }, [isAuthenticated, authLoading, currentMonth]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMonthlyReport(currentMonth);
      if (res.success) {
        setReport(res.data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeArrow = (change: number) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '';
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada data laporan</p>
        </div>
      </DashboardLayout>
    );
  }

  const maxDailyExpense = Math.max(...report.daily_totals.map(d => d.expense), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Laporan Bulanan</h1>
            <p className="text-muted-foreground">
              {getMonthName(currentMonth)} {currentMonth.split('-')[0]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-muted"
            >
              ←
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {getMonthName(currentMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-muted"
              disabled={currentMonth >= getCurrentMonth()}
            >
              →
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pemasukan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(report.total_income)}
              </div>
              {report.previous_month_comparison && (
                <p className={`text-xs mt-1 ${getChangeColor(report.previous_month_comparison.income_change)}`}>
                  {getChangeArrow(report.previous_month_comparison.income_change)} {Math.abs(report.previous_month_comparison.income_change_percent).toFixed(1)}% dari bulan lalu
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(report.total_expense)}
              </div>
              {report.previous_month_comparison && (
                <p className={`text-xs mt-1 ${getChangeColor(-report.previous_month_comparison.expense_change)}`}>
                  {getChangeArrow(-report.previous_month_comparison.expense_change)} {Math.abs(report.previous_month_comparison.expense_change_percent).toFixed(1)}% dari bulan lalu
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Bersih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${report.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(report.net_balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tingkat tabungan: {report.savings_rate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 3 Pengeluaran Terbesar</CardTitle>
            </CardHeader>
            <CardContent>
              {report.top_expenses.length === 0 ? (
                <p className="text-muted-foreground text-sm">Tidak ada pengeluaran</p>
              ) : (
                <div className="space-y-4">
                  {report.top_expenses.map((expense, index) => (
                    <div key={expense.category_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          {expense.category_icon || '💰'}
                        </div>
                        <div>
                          <p className="font-medium">{expense.category_name}</p>
                          <p className="text-xs text-muted-foreground">#{index + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((expense.amount / report.total_expense) * 100).toFixed(1)}% dari total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Transaksi</span>
                  <span className="font-semibold">{report.transaction_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rata-rata Pengeluaran/Hari</span>
                  <span className="font-semibold">
                    {formatCurrency(Math.round(report.total_expense / Math.max(report.daily_totals.length, 1)))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jumlah Kategori</span>
                  <span className="font-semibold">{report.categories.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tingkat Tabungan</span>
                  <span className={`font-semibold ${report.savings_rate >= 20 ? 'text-green-600' : report.savings_rate >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {report.savings_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pengeluaran Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {report.daily_totals.length === 0 ? (
                <p className="text-muted-foreground text-sm w-full text-center py-8">Tidak ada data</p>
              ) : (
                report.daily_totals.map((day, index) => {
                  const height = (day.expense / maxDailyExpense) * 100;
                  const dayNum = parseInt(day.date.split('-')[2]);
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-red-400 rounded-t hover:bg-red-500 transition-colors min-h-[2px]"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${formatCurrency(day.expense)}`}
                      />
                      {index % 5 === 0 && (
                        <span className="text-[10px] text-muted-foreground">{dayNum}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>1</span>
              <span>{report.daily_totals.length > 0 ? report.daily_totals[report.daily_totals.length - 1].date.split('-')[2] : ''}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Kategori Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {report.categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">Tidak ada pengeluaran</p>
            ) : (
              <div className="space-y-4">
                {report.categories.map((category) => (
                  <div key={category.category_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.category_icon || '💰'}</span>
                        <span className="font-medium">{category.category_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(category.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.transaction_count} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
