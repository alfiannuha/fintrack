'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    }
  }, [isAuthenticated, filterType]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await api.getTransactions(params);
      
      if (response.success) {
        const data = response.data as any;
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Gagal memuat transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    try {
      await api.deleteTransaction(id);
      toast.success('Transaksi dihapus');
      loadTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    filterType === 'all' ? true : tx.type === filterType
  );

  const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-4 md:p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Riwayat Transaksi</h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">Semua pemasukan dan pengeluaran Anda</p>
            </div>
            <Button 
              onClick={() => router.push('/transactions/new')} 
              className="w-full md:w-auto bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg text-sm md:text-base"
            >
              <span className="mr-1">+</span> <span className="md:hidden">Baru</span><span className="hidden md:inline">Transaksi Baru</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md font-medium transition-all duration-200"
              >
                Semua
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 gap-1"
              >
                <span className="hidden sm:inline">💰</span> Pemasukan
              </TabsTrigger>
              <TabsTrigger
                value="expense"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 gap-1"
              >
                <span className="hidden sm:inline">💸</span> Pengeluaran
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Memuat transaksi...</p>
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 bg-slate-800 flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <div>
                <p className="text-lg font-semibold">Belum ada transaksi</p>
                <p className="text-muted-foreground text-sm mt-1">Mulai catat transaksi pertama Anda</p>
              </div>
              <Button onClick={() => router.push('/transactions/new')} className="mt-2">
                + Tambah Transaksi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground ml-1 mb-3">{date}</h3>
                <div className="space-y-2">
                  {txs.map((tx) => (
                    <Card 
                      key={tx._id} 
                      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className={`h-1 ${tx.type === 'income' ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              tx.type === 'income' 
                                ? 'bg-green-100 bg-green-900/30' 
                                : 'bg-red-100 bg-red-900/30'
                            }`}>
                              <span className="text-xl">
                                {tx.type === 'income' ? '💰' : '💸'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-base">
                                {tx.category?.name || 'Unknown'}
                              </p>
                              {tx.note && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {tx.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`font-bold text-lg ${
                                tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {tx.type === 'income' ? '+' : '-'}
                                {formatCurrency(tx.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.date)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tx._id)}
                              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:bg-red-950/30"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
