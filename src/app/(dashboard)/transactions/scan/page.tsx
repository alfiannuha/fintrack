'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { ReceiptData, Category } from '@/types';

export default function ScanReceiptPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    category_id: '',
    merchant_name: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadCategories();
    }
  }, [isAuthenticated, authLoading]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      await scanReceipt(base64);
    };
    reader.readAsDataURL(file);
  };

  const scanReceipt = async (imageBase64: string) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/png;base64,${imageBase64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || 'helloworld',
        },
        body: formData,
      });

      const ocrResult = await response.json();

      if (ocrResult.IsErroredOnProcessing) {
        throw new Error(ocrResult.ErrorMessage?.[0] || 'OCR failed');
      }

      const text = ocrResult.ParsedResults?.[0]?.ParsedText || '';
      const parsedData = parseReceiptText(text);

      setReceiptData({
        merchant_name: parsedData.merchantName,
        date: parsedData.date,
        total_amount: parsedData.totalAmount,
        items: parsedData.items,
        raw_text: text,
      });

      setFormData(prev => ({
        ...prev,
        amount: parsedData.totalAmount ? String(parsedData.totalAmount) : '',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        merchant_name: parsedData.merchantName || '',
        note: parsedData.items.map(item => `${item.name}: ${formatCurrency(item.amount)}`).join('\n') || '',
      }));

      toast.success('Struk berhasil dipindai');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Gagal memindai struk. Silakan coba lagi.');
    } finally {
      setIsScanning(false);
    }
  };

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n');
    let merchantName = '';
    let date = '';
    let totalAmount = 0;
    const items: { name: string; amount: number }[] = [];

    const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      date = `${year}-${month}-${day}`;
    }

    // Find total amount - look for "total", "grand total", "jumlah", "bayar" first
    const totalPatterns = [
      /(?:total|grand total|grandtotal|jumlah|bayar|tagihan|netto|brutto)[\s:]*[\d,]+\.?\d*/i,
      /(?:Rp\s*)[\d,]+\.?\d*/i,
    ];
    
    let foundTotal = false;
    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amountMatch = match[0].match(/([\d,]+)/);
          if (amountMatch) {
            const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
            if (amount > 0 && amount < 100000000) {
              totalAmount = amount;
              foundTotal = true;
              break;
            }
          }
        }
      }
      if (foundTotal) break;
    }

    // If no total found, use the highest amount
    if (!foundTotal) {
      const amounts: number[] = [];
      for (const line of lines) {
        const match = line.match(/([\d,]+)\.?\d*$/);
        if (match) {
          const amount = parseInt(match[1].replace(/,/g, ''), 10);
          if (amount > 0 && amount < 100000000) {
            amounts.push(amount);
          }
        }
      }
      if (amounts.length > 0) {
        totalAmount = Math.max(...amounts);
      }
    }

    const potentialMerchant = lines.slice(0, 3).find(line => 
      line.trim().length > 3 && !line.match(/\d/) && !line.toLowerCase().includes('receipt')
    );
    if (potentialMerchant) {
      merchantName = potentialMerchant.trim();
    }

    const itemPattern = /^(.+?)\s+([\d,]+)\s*$/;
    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match && match[1].length > 2) {
        const itemName = match[1].trim();
        const itemAmount = parseInt(match[2].replace(/,/g, ''), 10);
        if (itemAmount > 0 && itemAmount < 10000000) {
          items.push({ name: itemName, amount: itemAmount });
        }
      }
    }

    return { merchantName, date, totalAmount, items };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category_id) {
      toast.error('Mohon lengkapi nominal dan kategori');
      return;
    }

    try {
      const res = await api.createTransaction({
        amount: parseInt(formData.amount),
        type: 'expense',
        date: formData.date,
        note: formData.note || formData.merchant_name,
        category_id: formData.category_id,
        merchant_name: formData.merchant_name,
      });

      if (res.success) {
        toast.success('Transaksi berhasil dibuat');
        router.push('/transactions');
      } else {
        toast.error('Gagal membuat transaksi');
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error('Error membuat transaksi');
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setReceiptData(null);
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      category_id: '',
      merchant_name: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 md:p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative">
            <h1 className="text-xl md:text-2xl font-bold">📷 Pindai Struk</h1>
            <p className="text-white/80 text-xs md:text-sm mt-1">Pindai struk atau upload foto receipt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!imagePreview && (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div 
                  className="relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center cursor-pointer hover:border-indigo-400 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
                      <span className="text-4xl">📸</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Ambil Foto Struk</p>
                    <p className="text-sm text-slate-500 mt-1">Ketuk untuk kamera atau pilih dari galeri</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </CardContent>
            </Card>
          )}

          {isScanning && (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-ping opacity-20"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin"></div>
                </div>
                <p className="text-lg font-semibold text-slate-700">Memindai Struk...</p>
                <p className="text-sm text-slate-500 mt-1">Mohon tunggu sebentar</p>
              </CardContent>
            </Card>
          )}

          {imagePreview && !isScanning && receiptData && (
            <div className="space-y-4">
              {/* Preview Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>🖼️</span> Preview
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetake}
                      className="text-xs h-8 rounded-lg"
                    >
                      Ganti Foto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-xl overflow-hidden bg-slate-100">
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="w-full h-48 object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Card */}
              <Card className="border-0 shadow-lg">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>📝</span> Data Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 ml-1">Nominal *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">Rp</span>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0"
                        className="pl-12 h-12 text-lg font-semibold rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 ml-1">Kategori *</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {categories
                        .filter((cat) => cat.type === 'expense')
                        .map((cat) => (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category_id: cat._id })}
                            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border-2 transition-all duration-200 ${
                              formData.category_id === cat._id
                                ? 'bg-red-50 text-red-600 border-red-400 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            <span className="text-xl">{cat.icon || '📁'}</span>
                            <span className="text-[9px] font-semibold truncate w-full text-center">{cat.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Merchant */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 ml-1">Nama Toko</Label>
                    <Input
                      value={formData.merchant_name}
                      onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                      placeholder="Nama merchant (opsional)"
                      className="rounded-xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 ml-1">Tanggal</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="rounded-xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 ml-1">Catatan</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Catatan tambahan..."
                      className="rounded-xl border-slate-200 bg-slate-50 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Items */}
                  {receiptData.items && receiptData.items.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setItemsExpanded(!itemsExpanded)}
                        className="w-full flex items-center justify-between text-sm font-medium text-slate-600"
                      >
                        <span>Item Terdeteksi ({receiptData.items.length})</span>
                        <span className="text-xs text-slate-400">
                          {itemsExpanded ? '▲ Sembunyikan' : '▼ Lihat semua'}
                        </span>
                      </button>
                      <div className="space-y-2 mt-2">
                        {(itemsExpanded ? receiptData.items : receiptData.items.slice(0, 5)).map((item: { name: string; amount: number }, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600 truncate max-w-[70%]">{item.name}</span>
                            <span className="font-medium text-slate-700">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        {!itemsExpanded && receiptData.items.length > 5 && (
                          <p className="text-xs text-indigo-500 text-center font-medium">+{receiptData.items.length - 5} item lainnya</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleRetake}
                      className="flex-1 h-12 text-base font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                      Pindai Ulang
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      Simpan Transaksi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
