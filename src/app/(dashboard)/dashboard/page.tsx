'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { formatCurrency, getMonthYear, getCurrentMonth, getPreviousMonth, getNextMonth } from '@/lib/utils';
import { toast } from 'sonner';
import type { DashboardSummary, CategoryChartData, Insight } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, wallet, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading, currentMonth]);

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

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const totalBudget = categoryData ? categoryData.reduce((sum, c) => sum + (c.amount || 0), 0) : 0;
  const spentBudget = categoryData ? categoryData.reduce((sum, c) => sum + (c.amount || 0), 0) : 0;
  const budgetProgress = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-white/50 shadow-lg">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                <AvatarFallback className="bg-white/20 text-white text-lg md:text-xl font-bold">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight">Halo, {user.name}!</h1>
                <p className="text-white/80 text-xs md:text-sm flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono text-xs">{wallet.code}</span>
                  <span className="hidden md:inline">Wallet Anda</span>
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 w-full md:w-auto">
              <Button 
                onClick={() => router.push('/transactions/new')} 
                className="flex-1 md:flex-none bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
              >
                <span className="mr-1">+</span> <span className="md:hidden">Baru</span><span className="hidden md:inline">Transaksi Baru</span>
              </Button>
              <Button 
                onClick={() => router.push('/report')} 
                variant="ghost"
                className="flex-1 md:flex-none text-white hover:bg-white/20 font-semibold text-sm md:text-base"
              >
                <span>📈</span> <span className="md:hidden ml-1">Laporan</span><span className="hidden md:inline ml-1">Laporan</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth} className="rounded-full w-10 h-10 p-0">
            ←
          </Button>
          <div className="bg-slate-100 bg-slate-800 px-6 py-2 rounded-full">
            <p className="text-sm font-semibold">{getMonthYear(currentMonth)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="rounded-full w-10 h-10 p-0">
            →
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 bg-green-900/30 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.total_income || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center">
                <span className="text-xl">💸</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.total_expense || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`h-1.5 bg-gradient-to-r ${(summary?.net_balance || 0) >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${(summary?.net_balance || 0) >= 0 ? 'bg-blue-100 bg-blue-900/30' : 'bg-orange-100 bg-orange-900/30'}`}>
                <span className="text-xl">💵</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (summary?.net_balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(summary?.net_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Side by Side on Desktop */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold ml-1">📊 Ringkasan Bulan Ini</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Category Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
                <CardDescription className="text-xs">Breakdown pengeluaran bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                {!categoryData || categoryData.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm">Belum ada data pengeluaran</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[240px] pr-4">
                    <div className="space-y-2">
                      {categoryData.map((item, index) => {
                        const total = categoryData.reduce((sum, c) => sum + (c.amount || 0), 0);
                        const percentage = total > 0 ? ((item.amount || 0) / total) * 100 : 0;
                        
                        return (
                          <div key={index} className="space-y-1 p-2 rounded-lg bg-slate-50 bg-slate-800/50 hover:bg-slate-100 hover:bg-slate-800 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{item.category}</span>
                              <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                            </div>
                            <Progress value={percentage} className="h-2 bg-slate-200 bg-slate-700" />
                            <p className="text-xs text-muted-foreground text-right">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget Overview</CardTitle>
                <CardDescription className="text-xs">Progress penggunaan budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Pengeluaran</span>
                    <span className="text-muted-foreground font-medium">{budgetProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetProgress} className="h-3 bg-slate-200 bg-slate-700" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-red-50 bg-red-950/30 text-center">
                    <p className="text-xs text-muted-foreground">Terpakai</p>
                    <p className="text-base font-bold text-red-600">
                      {formatCurrency(spentBudget)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 bg-green-950/30 text-center">
                    <p className="text-xs text-muted-foreground">Sisa</p>
                    <p className="text-base font-bold text-green-600">
                      {formatCurrency(Math.max(0, totalBudget - spentBudget))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Insights Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold ml-1">💡 Insights</h2>
          {!insights || insights.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl">💡</span>
                <p className="text-muted-foreground">Belum ada insights untuk bulan ini</p>
                <p className="text-xs text-muted-foreground">Insights akan muncul setelah ada transaksi yang cukup</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
                  insight.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
                  insight.type === 'success' ? 'border-l-4 border-l-green-500' :
                  insight.type === 'anomaly' ? 'border-l-4 border-l-red-500' :
                  'border-l-4 border-l-blue-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        insight.type === 'warning' ? 'bg-yellow-100 bg-yellow-900/30' :
                        insight.type === 'success' ? 'bg-green-100 bg-green-900/30' :
                        insight.type === 'anomaly' ? 'bg-red-100 bg-red-900/30' :
                        'bg-blue-100 bg-blue-900/30'
                      }`}>
                        <span className="text-lg">
                          {insight.type === 'warning' ? '⚠️' :
                           insight.type === 'success' ? '✅' :
                           insight.type === 'anomaly' ? '🚨' : 'ℹ️'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{insight.message}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          insight.severity === 'high' ? 'bg-red-100 text-red-700 bg-red-900/30 text-red-400' :
                          insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 bg-yellow-900/30 text-yellow-400' :
                          'bg-blue-100 text-blue-700 bg-blue-900/30 text-blue-400'
                        }`}>
                          {insight.severity}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
