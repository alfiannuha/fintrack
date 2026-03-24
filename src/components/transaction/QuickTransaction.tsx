'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import type { Category } from '@/types';

interface QuickTransactionProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function QuickTransaction({ onSuccess, onCancel }: QuickTransactionProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        // Filter categories by type
        const filtered = response.data.filter((c: Category) => c.type === txType);
        setCategories(filtered);
        // Set default category if not selected
        if (!formData.category_id && filtered.length > 0) {
          setFormData(prev => ({ ...prev, category_id: filtered[0]._id }));
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [txType]);

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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          {txType === 'expense' ? '💸 Catat Pengeluaran' : '💰 Catat Pemasukan'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={txType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTxType('expense')}
              className="w-full"
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={txType === 'income' ? 'default' : 'outline'}
              onClick={() => setTxType('income')}
              className="w-full"
            >
              Pemasukan
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formData.amount}
              onChange={handleAmountChange}
              className="text-2xl font-bold text-center h-16"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <Button
                  key={category._id}
                  type="button"
                  variant={formData.category_id === category._id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, category_id: category._id }))}
                  className="h-auto py-3 flex flex-col gap-1"
                  disabled={isLoading}
                >
                  <span className="text-xl">{category.icon || '📁'}</span>
                  <span className="text-xs">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (opsional)</Label>
            <Input
              id="note"
              type="text"
              placeholder="Contoh: Makan siang"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
                Batal
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 h-12 text-lg font-semibold"
              disabled={isLoading || !formData.amount || !formData.category_id}
            >
              {isLoading ? 'Menyimpan...' : `Simpan ${txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
