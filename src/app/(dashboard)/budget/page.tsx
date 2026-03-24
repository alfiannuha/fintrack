'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formatCurrency, getCurrentMonth, getMonthYear } from '@/lib/utils';
import { toast } from 'sonner';
import type { Budget, Category } from '@/types';

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 md:p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Budget</h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">Kontrol pengeluaran per kategori • {getMonthYear(currentMonth)}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
                <Button className="w-full md:w-auto bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg text-sm md:text-base">
                  <span className="mr-1">+</span> <span className="md:hidden">Baru</span><span className="hidden md:inline">Budget Baru</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <DialogTitle>Buat Budget Baru</DialogTitle>
                      <p className="text-sm text-muted-foreground font-normal">Atur budget untuk kategori tertentu</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleCreateBudget} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium ml-1">Kategori</Label>
                    <select
                      id="category"
                      value={newBudget.category_id}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full p-3 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      required
                    >
                      <option value="">Pilih kategori...</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-sm font-medium ml-1">Jumlah Budget</Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                      <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-transparent group-focus-within:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center px-4">
                          <span className="text-lg font-bold text-orange-600">Rp</span>
                          <Input
                            id="amount"
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={newBudget.amount}
                            onChange={handleAmountChange}
                            className="text-xl font-bold border-0 bg-transparent focus-visible:ring-0 pl-3"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-row gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-lg">
                      Batal
                    </Button>
                    <Button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold">
                      💾 Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budgets List */}
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Memuat budget...</p>
            </CardContent>
          </Card>
        ) : !budgets || budgets.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
              <div>
                <p className="text-lg font-semibold">Belum ada budget</p>
                <p className="text-muted-foreground text-sm mt-1">Buat budget untuk mengontrol pengeluaran per kategori</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-2 bg-orange-500 hover:bg-orange-600">
                + Tambah Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const progress = budget.progress || 0;
              const remaining = budget.amount - spent;
              const isOverBudget = spent > budget.amount;
              const isWarning = progress >= 80 && !isOverBudget;

              return (
                <Card key={budget._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`h-1 ${
                    isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    isWarning ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{budget.category?.icon || '📁'}</span>
                        {budget.category?.name || 'Unknown'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget._id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        🗑️
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terpakai</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-3 bg-slate-100 dark:bg-slate-800" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                        <p className="text-xs text-muted-foreground">Terpakai</p>
                        <p className={`font-bold text-sm ${isOverBudget ? 'text-red-600' : ''}`}>
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-bold text-sm">{formatCurrency(budget.amount)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                        <p className="text-xs text-muted-foreground">Sisa</p>
                        <p className={`font-bold text-sm ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.max(0, remaining))}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    {isOverBudget && (
                      <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-600 text-sm font-medium">
                        ⚠️ Over budget! Melebihi {formatCurrency(Math.abs(remaining))}
                      </div>
                    )}
                    {isWarning && !isOverBudget && (
                      <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                        ⚠️ Hampir habis! Sisa {formatCurrency(remaining)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
