'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthYear } from '@/lib/utils';
import { toast } from 'sonner';
import type { Budget, Category } from '@/types';

const categoryEmojis: Record<string, string> = {
  Makan: '🍔',
  Transport: '🚗',
  Tagihan: '📄',
  Belanja: '🛍️',
  Hiburan: '🎬',
  Kesehatan: '💊',
  Gaji: '💰',
  Freelance: '💻',
  Bonus: '🎁',
  Investasi: '📈',
  Lainnya: '📌',
};

export default function BudgetPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth] = useState(getCurrentMonth());
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, currentMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.getBudgets(),
        api.getCategories(),
      ]);

      if (budgetsRes.success && budgetsRes.data) {
        setBudgets(budgetsRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        const expenseCategories = categoriesRes.data.filter((c: Category) => c.type === 'expense');
        setCategories(expenseCategories);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBudget.category_id || !newBudget.amount) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    try {
      await api.createBudget({
        category_id: newBudget.category_id,
        amount: parseInt(newBudget.amount.replace(/\./g, '')) || parseInt(newBudget.amount),
        month: currentMonth,
      });

      toast.success('Budget berhasil dibuat');
      setIsDialogOpen(false);
      setNewBudget({ category_id: '', amount: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Yakin ingin menghapus budget ini?')) return;

    try {
      await api.deleteBudget(id);
      toast.success('Budget dihapus');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus budget');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = new Intl.NumberFormat('id-ID').format(parseInt(value));
    }
    setNewBudget(prev => ({ ...prev, amount: value }));
  };

  if (!isAuthenticated) {
    return null;
  }

  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-4 md:p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Budget</h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">{getMonthYear(currentMonth)}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
                <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 cursor-pointer">
                  <span className="mr-1">+</span> Budget Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Buat Budget Baru
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBudget} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">Kategori</Label>
                    <select
                      id="category"
                      value={newBudget.category_id}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, category_id: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-pink-200! dark:border-pink-800! bg-background dark:bg-pink-950/20 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/20 focus-visible:ring-offset-2 cursor-pointer"
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {categoryEmojis[cat.name] || '📌'} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">Budget (Rp)</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newBudget.amount}
                      onChange={handleAmountChange}
                      className="text-lg font-semibold cursor-pointer border-pink-200! dark:border-pink-800! bg-pink-50! dark:bg-pink-950/20!"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                      Batal
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 cursor-pointer">
                      Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overall Summary Card */}
        <Card className="border-pink-200! dark:border-pink-800! bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Ringkasan Budget</CardTitle>
            <CardDescription className="text-xs">Total semua kategori bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Budget</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalBudget)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Terpakai</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Sisa</p>
                <p className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(Math.max(0, totalRemaining))}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{overallProgress.toFixed(1)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Budgets List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                  <div className="h-2 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <Card className="border-dashed border-pink-200! dark:border-pink-800!">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-muted-foreground font-medium">Belum ada budget</p>
              <p className="text-sm text-muted-foreground mt-1">
                Buat budget untuk mengontrol pengeluaran per kategori
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const progress = budget.progress || 0;
              const remaining = budget.amount - spent;
              const isOverBudget = spent > budget.amount;
              const isWarning = progress >= 80 && !isOverBudget;
              const categoryName = budget.category?.name || 'Unknown';
              const categoryIcon = categoryEmojis[categoryName] || '📌';

              return (
                <Card key={budget._id} className="group hover:shadow-lg transition-all duration-300 border-pink-100! dark:border-pink-900! overflow-hidden cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                        <AvatarFallback className="text-xl bg-transparent">
                          {categoryIcon}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{categoryName}</h3>
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs cursor-pointer">
                              Over
                            </Badge>
                          )}
                          {isWarning && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 cursor-pointer">
                              ⚠️ Hampir habis
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(spent)} dari {formatCurrency(budget.amount)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-600"
                      >
                        🗑️
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Progress 
                        value={progress} 
                        className={`h-2 ${
                          isOverBudget 
                            ? '[&>div]:bg-red-500' 
                            : isWarning 
                            ? '[&>div]:bg-yellow-500' 
                            : '[&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-rose-500'
                        }`} 
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-muted-foreground">
                          {progress.toFixed(1)}% digunakan
                        </span>
                        <span className={`font-semibold ${
                          remaining < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          Sisa: {formatCurrency(Math.max(0, remaining))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-pink-200! dark:border-pink-800! bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-white dark:from-pink-950/10 dark:via-rose-950/10 dark:to-background">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tip Budget</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Set budget realistis berdasarkan pengeluaran bulan lalu. Review dan adjust setiap bulan untuk hasil terbaik.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
