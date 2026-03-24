'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Category } from '@/types';

interface QuickTransactionProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function QuickTransaction({ onSuccess, onCancel }: QuickTransactionProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const handleTypeChange = (type: 'income' | 'expense') => {
    setTxType(type);
    setFormData(prev => ({ ...prev, category_id: '' }));
  };

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        const filtered = response.data.filter((c: Category) => c.type === txType);
        setCategories(filtered);
        if (filtered.length > 0) {
          setFormData(prev => ({ ...prev, category_id: filtered[0]._id }));
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadCategories();
    }
  }, [isAuthenticated, authLoading, txType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    setIsLoading(true);
    try {
      await api.createTransaction({
        amount: parseInt(formData.amount.replace(/\./g, '')) || parseInt(formData.amount),
        category_id: formData.category_id,
        type: txType,
        date: new Date(formData.date).toISOString(),
        note: formData.note,
      });

      toast.success('Transaksi berhasil ditambahkan!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      toast.error(error.message || 'Gagal menambahkan transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = new Intl.NumberFormat('id-ID').format(parseInt(value));
    }
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const isSelected = (categoryId: string) => formData.category_id === categoryId;

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl font-bold">
          {txType === 'expense' ? '💸 Catat Pengeluaran' : '💰 Catat Pemasukan'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Type Toggle */}
          <Tabs value={txType} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="expense"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium py-2"
              >
                💸 Pengeluaran
              </TabsTrigger>
              <TabsTrigger 
                value="income"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium py-2"
              >
                💰 Pemasukan
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">Jumlah (Rp)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formData.amount}
                onChange={handleAmountChange}
                className="text-2xl font-bold text-right h-16 pl-12 pr-4"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Pilih Kategori</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category_id: category._id }))}
                  disabled={isLoading}
                  className={`flex flex-row items-center justify-center gap-2 py-3 px-2 rounded-lg border transition-all duration-200 ${
                    isSelected(category._id)
                      ? txType === 'expense' 
                        ? 'bg-red-50 text-red-700 border-red-400 shadow-sm'
                        : 'bg-green-50 text-green-700 border-green-400 shadow-sm'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-lg">{category.icon || '📁'}</span>
                  <span className="text-xs font-medium truncate">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-muted-foreground">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-muted-foreground">Catatan</Label>
            <Input
              id="note"
              type="text"
              placeholder="Opsional"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1 h-12 text-base font-medium rounded-lg"
                disabled={isLoading}
              >
                Batal
              </Button>
            )}
            <Button 
              type="submit" 
              className={`flex-1 h-12 text-base font-semibold rounded-lg ${
                txType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              disabled={isLoading || !formData.amount || !formData.category_id}
            >
              {isLoading ? 'Menyimpan...' : `Simpan`}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
