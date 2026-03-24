'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

      if (budgetsRes.success) {
        setBudgets(budgetsRes.data);
      }
      if (categoriesRes.success) {
        // Filter only expense categories
        setCategories(categoriesRes.data.filter((c: Category) => c.type === 'expense'));
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget</h1>
            <p className="text-muted-foreground">
              Kontrol pengeluaran per kategori • {getMonthYear(currentMonth)}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button>+ Budget Baru</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Budget Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <select
                    id="category"
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Budget (Rp)</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={newBudget.amount}
                    onChange={handleAmountChange}
                    className="text-xl font-bold"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Budgets List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Belum ada budget</p>
              <p className="text-sm text-muted-foreground mt-2">
                Buat budget untuk mengontrol pengeluaran per kategori
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const progress = budget.progress || 0;
              const remaining = budget.amount - spent;
              const isOverBudget = spent > budget.amount;
              const isWarning = progress >= 80 && !isOverBudget;

              return (
                <Card key={budget._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {budget.category?.icon || '📁'} {budget.category?.name || 'Unknown'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget._id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress Bar */}
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all ${
                          isOverBudget
                            ? 'bg-red-500'
                            : isWarning
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Terpakai</p>
                        <p className={`font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold">{formatCurrency(budget.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Sisa</p>
                        <p className={`font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.max(0, remaining))}
                        </p>
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {progress.toFixed(1)}% digunakan
                      </span>
                      {isOverBudget && (
                        <span className="text-sm text-red-600 font-semibold">
                          ⚠️ Over budget!
                        </span>
                      )}
                      {isWarning && !isOverBudget && (
                        <span className="text-sm text-yellow-600 font-semibold">
                          ⚠️ Hampir habis
                        </span>
                      )}
                    </div>
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
