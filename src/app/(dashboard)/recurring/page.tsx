'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Category, RecurringRule } from '@/types';

export default function RecurringPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    category_id: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    note: '',
    day_of_month: 1,
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
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, categoriesRes] = await Promise.all([
        api.getRecurring(),
        api.getCategories(),
      ]);

      if (rulesRes.success && rulesRes.data) {
        setRules(rulesRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRule.category_id || !newRule.amount) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    try {
      await api.createRecurring({
        category_id: newRule.category_id,
        amount: parseInt(newRule.amount.replace(/\./g, '')) || parseInt(newRule.amount),
        type: newRule.type,
        note: newRule.note,
        day_of_month: newRule.day_of_month,
      });

      toast.success('Recurring transaction berhasil dibuat');
      setIsDialogOpen(false);
      setNewRule({ category_id: '', amount: '', type: 'expense', note: '', day_of_month: 1 });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat recurring transaction');
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await api.toggleRecurring(id);
      toast.success('Recurring transaction diupdate');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal update recurring transaction');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Yakin ingin menghapus recurring transaction ini?')) return;

    try {
      await api.deleteRecurring(id);
      toast.success('Recurring transaction dihapus');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus recurring transaction');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = new Intl.NumberFormat('id-ID').format(parseInt(value));
    }
    setNewRule(prev => ({ ...prev, amount: value }));
  };

  if (!isAuthenticated) {
    return null;
  }

  const filteredCategories = categories.filter(c => c.type === newRule.type);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Transaksi Berulang</h1>
              <p className="text-white/80 text-sm mt-1">Otomatis catat transaksi rutin setiap bulan</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
                <Button className="bg-white text-cyan-600 hover:bg-white/90 font-semibold shadow-lg">
                  <span className="mr-1">+</span> Aturan Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <span className="text-xl">🔄</span>
                    </div>
                    <div>
                      <DialogTitle>Buat Transaksi Berulang</DialogTitle>
                      <p className="text-sm text-muted-foreground font-normal">Atur transaksi yang会自动 setiap bulan</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleCreateRule} className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium ml-1">Tipe Transaksi</Label>
                    <Tabs value={newRule.type} onValueChange={(v) => setNewRule(prev => ({ ...prev, type: v as 'income' | 'expense', category_id: '' }))} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <TabsTrigger value="expense" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white font-medium">
                          💸 Pengeluaran
                        </TabsTrigger>
                        <TabsTrigger value="income" className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white font-medium">
                          💰 Pemasukan
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium ml-1">Kategori</Label>
                    <select
                      id="category"
                      value={newRule.category_id}
                      onChange={(e) => setNewRule(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full p-3 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      required
                    >
                      <option value="">Pilih kategori...</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-sm font-medium ml-1">Jumlah</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                      <Input
                        id="amount"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={newRule.amount}
                        onChange={handleAmountChange}
                        className="text-lg font-bold pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <Label htmlFor="day" className="text-sm font-medium ml-1">Tanggal (1-31)</Label>
                      <Input
                        id="day"
                        type="number"
                        min="1"
                        max="31"
                        value={newRule.day_of_month}
                        onChange={(e) => setNewRule(prev => ({ ...prev, day_of_month: parseInt(e.target.value) || 1 }))}
                        className="text-center font-semibold"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="note" className="text-sm font-medium ml-1">Catatan</Label>
                      <Input
                        id="note"
                        type="text"
                        placeholder="Contoh: Gaji"
                        value={newRule.note}
                        onChange={(e) => setNewRule(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-lg">
                      Batal
                    </Button>
                    <Button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-semibold">
                      💾 Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Rules List */}
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Memuat transaksi berulang...</p>
            </CardContent>
          </Card>
        ) : !rules || rules.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <span className="text-4xl">🔄</span>
              </div>
              <div>
                <p className="text-lg font-semibold">Belum ada transaksi berulang</p>
                <p className="text-muted-foreground text-sm mt-1">Buat aturan untuk otomatis mencatat transaksi rutin seperti gaji, sewa, atau tagihan</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-2 bg-cyan-500 hover:bg-cyan-600">
                + Tambah Aturan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rules.map((rule) => (
              <Card key={rule._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-1 ${rule.is_active ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{rule.type === 'income' ? '💰' : '💸'}</span>
                      {rule.category?.name || 'Unknown'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={rule.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleRule(rule._id)}
                        className={rule.is_active ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                      >
                        {rule.is_active ? '✓ Aktif' : 'Nonaktif'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule._id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-muted-foreground">Jumlah</p>
                      <p className={`font-bold text-lg ${rule.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(rule.amount)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-muted-foreground">Jadwal</p>
                      <p className="font-semibold">Tanggal {rule.day_of_month}</p>
                    </div>
                  </div>
                  
                  {rule.note && (
                    <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30">
                      <p className="text-xs text-muted-foreground">Catatan</p>
                      <p className="font-medium">{rule.note}</p>
                    </div>
                  )}
                  
                  <div className={`text-xs text-center py-2 rounded-lg ${
                    rule.is_active 
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                  }`}>
                    {rule.is_active ? '✅ Aktif - Berjalan otomatis' : '⏸️ Nonaktif - Tidak berjalan'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>💡</span> Cara Kerja
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-lg">1️⃣</span>
              <p>Transaksi berulang akan otomatis dibuat setiap bulan sesuai tanggal yang ditentukan</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-lg">2️⃣</span>
              <p>Sistem akan menjalankan cron job setiap hari untuk memeriksa aturan yang harus dijalankan</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-lg">3️⃣</span>
              <p>Transaksi yang sudah dibuat tidak akan dibuat ulang di hari yang sama</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-lg">4️⃣</span>
              <p>Anda bisa menonaktifkan aturan tanpa menghapusnya menggunakan switch</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
