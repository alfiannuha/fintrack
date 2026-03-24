'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                Halo, {user.name} • <span className="font-mono">{wallet.code}</span>
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/transactions/new')} className="gap-2">
            <span>+</span> Transaksi Baru
          </Button>
        </div>

        <Separator />

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            ← Previous
          </Button>
          <Card className="w-[200px]">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium">{getMonthYear(currentMonth)}</p>
            </CardContent>
          </Card>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            Next →
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.total_income || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
              <span className="text-2xl">💸</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.total_expense || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 ${
            (summary?.net_balance || 0) < 0 ? 'border-orange-200 bg-orange-50' : ''
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <span className="text-2xl">💵</span>
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

        {/* Tabs for Charts & Insights */}
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="charts" className="gap-2">
              <span>📊</span>
              <span>Charts</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <span>💡</span>
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Pengeluaran per Kategori</CardTitle>
                  <CardDescription>Breakdown pengeluaran bulan ini</CardDescription>
                </CardHeader>
                <CardContent>
                  {!categoryData || categoryData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      Belum ada data pengeluaran
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        {categoryData.map((item, index) => {
                          const total = categoryData.reduce((sum, c) => sum + (c.amount || 0), 0);
                          const percentage = total > 0 ? ((item.amount || 0) / total) * 100 : 0;
                          
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.category}</span>
                                <span className="text-muted-foreground">{formatCurrency(item.amount)}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
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
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                  <CardDescription>Progress penggunaan budget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total Budget Used</span>
                      <span className="text-muted-foreground">{budgetProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={budgetProgress} className="h-3" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(spentBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(Math.max(0, totalBudget - spentBudget))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 animate-fade-in">
            {!insights || insights.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum ada insights untuk bulan ini
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {insights.map((insight, index) => (
                  <Card key={index} className={`border-l-4 ${
                    insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                    insight.type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-950' :
                    insight.type === 'anomaly' ? 'border-l-red-500 bg-red-50 dark:bg-red-950' :
                    'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {insight.type === 'warning' ? '⚠️' :
                           insight.type === 'success' ? '✅' :
                           insight.type === 'anomaly' ? '🚨' : 'ℹ️'}
                        </span>
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold">{insight.title}</p>
                          <p className="text-sm text-muted-foreground">{insight.message}</p>
                          <p className="text-xs text-muted-foreground">
                            Severity: <span className="font-medium capitalize">{insight.severity}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
