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
      // Convert base64 to blob
      const byteCharacters = atob(imageBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const formData = new FormData();
      formData.append('document', blob, 'receipt.png');

      // Use Mindee API for receipt parsing
      const apiKey = process.env.NEXT_PUBLIC_MINDEE_API_KEY;
      if (!apiKey) {
        throw new Error('Mindee API key not configured');
      }

      const response = await fetch('https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Mindee API error: ${response.status}`);
      }

      const mindeeResult = await response.json();
      
      // Parse Mindee response
      const document = mindeeResult?.document;
      const inference = document?.inference;
      const prediction = inference?.prediction;
      
      // Extract data from Mindee response
      const merchantName = prediction?.merchant_name?.[0]?.value || '';
      const date = prediction?.date?.value ? formatMindeeDate(prediction.date.value) : '';
      const totalAmount = prediction?.total_amount?.value || 0;
      
      // Extract line items
      const items: { name: string; amount: number }[] = [];
      const lineItems = prediction?.line_items || [];
      for (const item of lineItems) {
        if (item.description && item.total_amount?.value) {
          items.push({
            name: item.description[0]?.value || 'Item',
            amount: Math.round(item.total_amount.value * 100) // Convert to cents
          });
        }
      }

      // Build raw text from OCR for reference
      const rawText = `${merchantName}\n${date}\nTotal: ${totalAmount}\n\nItems:\n${items.map(i => `${i.name}: ${i.amount}`).join('\n')}`;

      setReceiptData({
        merchant_name: merchantName,
        date: date,
        total_amount: Math.round(totalAmount * 100),
        items: items,
        raw_text: rawText,
      });

      setFormData(prev => ({
        ...prev,
        amount: totalAmount ? String(Math.round(totalAmount * 100)) : '',
        date: date || new Date().toISOString().split('T')[0],
        merchant_name: merchantName || '',
        note: items.map(item => `${item.name}: ${formatCurrency(item.amount)}`).join('\n') || '',
      }));

      toast.success('Struk berhasil dipindai');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Gagal memindai struk. Pastikan API key Mindee sudah benar.');
    } finally {
      setIsScanning(false);
    }
  };

  // Helper function to format Mindee date
  const formatMindeeDate = (dateStr: string): string => {
    // Mindee returns dates as YYYY-MM-DD or YYYYMMDD
    const cleaned = dateStr.replace(/-/g, '');
    if (cleaned.length === 8) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let merchantName = '';
    let date = '';
    let totalAmount = 0;
    const items: { name: string; amount: number }[] = [];
    
    // Clean up text
    const cleanText = text.replace(/\s+/g, ' ');

    // 1. Find date - multiple patterns
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})/,  // DD/MM/YY
      /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,  // YYYY/MM/DD
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match[1].length === 4) {
          // YYYY-MM-DD format
          date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else if (match[1].length === 2 && match[3].length === 2) {
          // DD/MM/YY format
          const year = parseInt(match[3]) > 50 ? '19' + match[3] : '20' + match[3];
          date = `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY
          date = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
        break;
      }
    }

    // 2. Find total amount - look for keywords first
    const totalKeywords = [
      'total', 'grand total', 'grandtotal', 'jumlah total', 'jumlah',
      'bayar', 'tagihan', 'netto', 'brutto', 'subtotal', 'amount due',
      'total due', 'balance', 'grand amount', 'ttl'
    ];
    
    let foundTotal = false;
    
    // First pass: look for lines with total keywords
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasKeyword = totalKeywords.some(kw => lowerLine.includes(kw));
      
      if (hasKeyword) {
        // Extract all numbers from line
        const amounts = line.match(/[\d,]+(?:\.\d{2})?/g);
        if (amounts) {
          for (const amt of amounts) {
            const num = parseInt(amt.replace(/,/g, ''), 10);
            if (num > 0 && num < 100000000 && num > totalAmount) {
              totalAmount = num;
              foundTotal = true;
            }
          }
        }
      }
    }

    // Second pass: if no total found, look for "Rp" prefix amounts
    if (!foundTotal) {
      for (const line of lines) {
        if (line.toLowerCase().includes('rp')) {
          const amounts = line.match(/[\d,]+/g);
          if (amounts) {
            for (const amt of amounts) {
              const num = parseInt(amt.replace(/,/g, ''), 10);
              if (num > 0 && num < 100000000 && num > totalAmount) {
                totalAmount = num;
                foundTotal = true;
              }
            }
          }
        }
      }
    }

    // Third pass: if still no total, use the largest number
    if (!foundTotal) {
      const allAmounts: number[] = [];
      for (const line of lines) {
        const amounts = line.match(/[\d,]+(?:\.\d{2})?/g);
        if (amounts) {
          for (const amt of amounts) {
            const num = parseInt(amt.replace(/,/g, ''), 10);
            if (num > 1000 && num < 100000000) {
              allAmounts.push(num);
            }
          }
        }
      }
      if (allAmounts.length > 0) {
        totalAmount = Math.max(...allAmounts);
      }
    }

    // 3. Find merchant name - usually at the top, no numbers
    const skipWords = ['receipt', 'struk', 'tax', 'invoice', 'payment', 'tunai', 'cash', 'kembalian', 'kembali', 'discount', 'potongan'];
    for (const line of lines.slice(0, 5)) {
      const lowerLine = line.toLowerCase();
      const hasSkipWord = skipWords.some(w => lowerLine.includes(w));
      const hasNumber = /\d/.test(line);
      
      if (line.length > 3 && !hasSkipWord && !hasNumber && !line.includes('•') && !line.includes('*')) {
        merchantName = line;
        break;
      }
    }

    // 4. Parse items - look for patterns like "itemname 10000" or "itemname Rp 10.000"
    const itemLinePatterns = [
      /^(.+?)\s+([\d,]+)$/,  // itemname 10000
      /^(.+?)\s+Rp\s*([\d,.]+)$/i,  // itemname Rp 10.000
      /^(.+?)\s+x\s*\d+\s+([\d,]+)$/i,  // itemname x2 15000
    ];
    
    const excludeItemWords = ['total', 'subtotal', 'tax', 'pajak', 'discount', 'bayar', 'kembali', 'tunai', 'cash', ' kembalian', 'service', 'admin', 'fee', 'charge'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const isExcluded = excludeItemWords.some(w => lowerLine.includes(w));
      
      if (isExcluded) continue;
      
      for (const pattern of itemLinePatterns) {
        const match = line.match(pattern);
        if (match) {
          const itemName = match[1].trim();
          const itemAmount = parseInt(match[2].replace(/,/g, ''), 10);
          
          if (itemName.length > 1 && itemAmount > 0 && itemAmount < 50000000) {
            // Avoid duplicates
            const exists = items.some(i => i.name === itemName || Math.abs(i.amount - itemAmount) < 100);
            if (!exists) {
              items.push({ name: itemName, amount: itemAmount });
            }
          }
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
