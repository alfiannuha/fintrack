'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, getMonthYear, getCurrentMonth, getPreviousMonth, getNextMonth } from '@/lib/utils';
import { toast } from 'sonner';
import type { DashboardSummary, CategoryChartData, Insight } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, wallet } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, currentMonth]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, categoryRes, insightsRes] = await Promise.all([
        api.getDashboardSummary(currentMonth),
        api.getCategoryChartData(currentMonth),
        api.getInsights(currentMonth),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
      if (categoryRes.success) {
        setCategoryData(categoryRes.data);
      }
      if (insightsRes.success) {
        setInsights(insightsRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
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

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Halo, {user?.name} • Wallet: {wallet?.code}
            </p>
          </div>
          <Button onClick={() => router.push('/transactions/new')}>
            + Transaksi Baru
          </Button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            ←
          </Button>
          <span className="font-semibold min-w-[150px] text-center">
            {getMonthYear(currentMonth)}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            →
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '-' : formatCurrency(summary?.total_income || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
              <span className="text-2xl">💸</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '-' : formatCurrency(summary?.total_expense || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <span className="text-2xl">💵</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? '-' : formatCurrency(summary?.net_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Insights */}
        {insights.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">💡 Insights Keuangan</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {insights.map((insight, index) => (
                <Card key={index} className={
                  insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  insight.type === 'success' ? 'border-green-500 bg-green-50' :
                  insight.type === 'anomaly' ? 'border-red-500 bg-red-50' :
                  'border-blue-500 bg-blue-50'
                }>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {insight.type === 'warning' ? '⚠️' :
                         insight.type === 'success' ? '✅' :
                         insight.type === 'anomaly' ? '🚨' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{insight.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  Belum ada data pengeluaran
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryData.slice(0, 5).map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${categoryData.length > 0 ? (item.amount / categoryData.reduce((sum, c) => sum + c.amount, 0)) * 100 : 0}%`,
                            backgroundColor: item.color || 'hsl(var(--primary))',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rata-rata harian</span>
                    <span className="font-medium">
                      {formatCurrency((summary?.total_expense || 0) / new Date().getDate())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sisa hari ini</span>
                    <span className="font-medium">
                      {formatCurrency(Math.max(0, (summary?.net_balance || 0)))}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      💡 Tip: Catat setiap pengeluaran segera untuk tracking yang lebih akurat
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
