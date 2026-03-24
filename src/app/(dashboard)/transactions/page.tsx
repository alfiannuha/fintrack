'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
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
        // API returns { transactions: [], total, page, limit }
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

  // Group by date
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
            <p className="text-muted-foreground">Semua pemasukan dan pengeluaran</p>
          </div>
          <Button onClick={() => router.push('/transactions/new')}>
            + Transaksi Baru
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Semua
          </Button>
          <Button
            variant={filterType === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('income')}
          >
            💰 Pemasukan
          </Button>
          <Button
            variant={filterType === 'expense' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('expense')}
          >
            💸 Pengeluaran
          </Button>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Belum ada transaksi</p>
              <Button variant="link" onClick={() => router.push('/transactions/new')}>
                Tambah transaksi pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <Card key={date}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {txs.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {tx.type === 'income' ? '💰' : '💸'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.category?.name || 'Unknown'}
                          </p>
                          {tx.note && (
                            <p className="text-sm text-muted-foreground">
                              {tx.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tx._id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
