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

      if (rulesRes.success) {
        setRules(rulesRes.data);
      }
      if (categoriesRes.success) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transaksi Berulang</h1>
            <p className="text-muted-foreground">
              Otomatis catat transaksi rutin setiap bulan
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button>+ Aturan Baru</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Transaksi Berulang</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRule} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Tabs value={newRule.type} onValueChange={(v) => setNewRule(prev => ({ ...prev, type: v as 'income' | 'expense' }))} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="expense">💸 Pengeluaran</TabsTrigger>
                      <TabsTrigger value="income">💰 Pemasukan</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <select
                    id="category"
                    value={newRule.category_id}
                    onChange={(e) => setNewRule(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories
                      .filter(c => c.type === newRule.type)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={newRule.amount}
                    onChange={handleAmountChange}
                    className="text-xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day">Tanggal (setiap bulan)</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    value={newRule.day_of_month}
                    onChange={(e) => setNewRule(prev => ({ ...prev, day_of_month: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Catatan</Label>
                  <Input
                    id="note"
                    type="text"
                    placeholder="Contoh: Gaji bulanan"
                    value={newRule.note}
                    onChange={(e) => setNewRule(prev => ({ ...prev, note: e.target.value }))}
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

        {/* Rules List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Belum ada transaksi berulang</p>
              <p className="text-sm text-muted-foreground mt-2">
                Buat aturan untuk otomatis mencatat transaksi rutin seperti gaji, sewa, atau tagihan
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {rule.type === 'income' ? '💰' : '💸'} {rule.category?.name || 'Unknown'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={rule.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleRule(rule._id)}
                      >
                        {rule.is_active ? 'Aktif' : 'Nonaktif'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule._id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah</p>
                      <p className="font-semibold text-lg">{formatCurrency(rule.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tanggal</p>
                      <p className="font-semibold">Setiap tanggal {rule.day_of_month}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Catatan</p>
                      <p className="font-medium">{rule.note || '-'}</p>
                    </div>
                  </div>
                  {rule.last_run_at && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Terakhir dijalankan: {new Date(rule.last_run_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Cara Kerja</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>Transaksi berulang akan otomatis dibuat setiap bulan sesuai tanggal yang ditentukan</li>
              <li>Sistem akan menjalankan cron job setiap hari untuk memeriksa aturan yang harus dijalankan</li>
              <li>Transaksi yang sudah dibuat tidak akan dibuat ulang di hari yang sama</li>
              <li>Anda bisa menonaktifkan aturan tanpa menghapusnya</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
