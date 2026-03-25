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
  const [showScanOption, setShowScanOption] = useState(false);
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

  const handleScanClick = () => {
    router.push('/transactions/scan');
  };

  const isSelected = (categoryId: string) => formData.category_id === categoryId;

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 overflow-hidden mt-4 md:mt-0">
      {/* Header Gradient */}
        <div className={`h-2 ${
          txType === 'expense' 
            ? 'bg-gradient-to-r from-red-400 to-red-600' 
            : 'bg-gradient-to-r from-green-400 to-green-600'
        }`} />
        
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="text-center text-2xl font-bold">
            {txType === 'expense' ? '💸 Catat Pengeluaran' : '💰 Catat Pemasukan'}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Tambahkan transaksi baru dengan cepat
          </p>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 pb-6">
            {/* Type Tabs - Modern Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground ml-1">Tipe Transaksi</Label>
              <Tabs value={txType} onValueChange={handleTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                  <TabsTrigger
                    value="expense"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">💸</span> 
                    <span>Pengeluaran</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="income"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">💰</span> 
                    <span>Pemasukan</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scan Button - Mobile Only */}
            <button
              type="button"
              onClick={handleScanClick}
              className="w-full md:hidden flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <span className="text-xl">📷</span>
              <span className="font-medium">Scan Struk / Upload</span>
            </button>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground ml-1">Jumlah</Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-slate-50 rounded-xl border-2 border-transparent group-focus-within:border-primary/30 transition-all duration-300">
                  <div className="flex items-center px-4">
                    <span className={`text-2xl font-bold ${txType === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                      Rp
                    </span>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      className="text-3xl font-bold text-right h-16 border-0 bg-transparent focus-visible:ring-0 pl-3"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground ml-1">Kategori</Label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category_id: category._id }))}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      isSelected(category._id)
                        ? txType === 'expense' 
                          ? 'bg-red-50 text-red-600 border-red-400 shadow-md'
                          : 'bg-green-50 text-green-600 border-green-400 shadow-md'
                        : 'bg-white text-muted-foreground border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{category.icon || '📁'}</span>
                    <span className="text-[10px] font-semibold truncate w-full text-center">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Note */}
            <div className="flex flex-col gap-3">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-muted-foreground ml-1">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  disabled={isLoading}
                  className="h-11 rounded-lg bg-slate-50 border-slate-200"
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-muted-foreground ml-1">Catatan</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="Opsional"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  disabled={isLoading}
                  className="h-11 rounded-lg bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel} 
                  className="flex-1 h-12 text-base font-semibold rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all duration-200"
                  disabled={isLoading}
                >
                  Batal
                </Button>
              )}
              <Button 
                type="submit" 
                className={`flex-1 h-12 text-base font-bold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                  txType === 'expense' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }`}
                disabled={isLoading || !formData.amount || !formData.category_id}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  `💾 Simpan`
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
  );
}
