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
      // Using OCR.space free API
      const formData = new FormData();
      formData.append('base64Image', `data:image/png;base64,${imageBase64}`);
      formData.append('language', 'ind');
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

      toast.success('Receipt scanned successfully');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Error scanning receipt. Please try again.');
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

    // Find date
    const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      date = `${year}-${month}-${day}`;
    }

    // Find total amount
    const totalPatterns = [
      /(?:total|grand total|jumlah|bayar|tagihan)[:\s]*[\d,]+\.?\d*/i,
      /Rp\s*([\d,.]+)/i,
    ];
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

    // First few lines as merchant name
    const potentialMerchant = lines.slice(0, 3).find(line => 
      line.trim().length > 3 && !line.match(/\d/) && !line.toLowerCase().includes('receipt')
    );
    if (potentialMerchant) {
      merchantName = potentialMerchant.trim();
    }

    // Parse items
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
      toast.error('Please fill in required fields');
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
        toast.success('Transaction created successfully');
        router.push('/transactions');
      } else {
        toast.error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error('Error creating transaction');
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
        <div>
          <h1 className="text-3xl font-bold">Scan Receipt</h1>
          <p className="text-muted-foreground">Scan a receipt to create a transaction</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!imagePreview && (
            <Card>
              <CardContent className="pt-6">
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-lg font-medium">Tap to take a photo</p>
                  <p className="text-sm text-muted-foreground">or select from gallery</p>
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
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-medium">Scanning receipt...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </CardContent>
            </Card>
          )}

          {imagePreview && !isScanning && receiptData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receipt Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="w-full max-h-64 object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRetake}
                    >
                      Retake
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Scanned Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receiptData.raw_text && (
                    <div>
                      <Label className="text-muted-foreground">Raw Text (for verification)</Label>
                      <Textarea
                        value={receiptData.raw_text}
                        readOnly
                        className="h-24 text-xs mt-1"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="merchant_name">Merchant Name</Label>
                      <Input
                        id="merchant_name"
                        value={formData.merchant_name}
                        onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                        placeholder="Store name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      >
                        <option value="">Select category</option>
                        {categories
                          .filter((cat) => cat.type === 'expense')
                          .map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>

                  {receiptData.items && receiptData.items.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Items Found</Label>
                      <div className="mt-2 space-y-2">
                        {receiptData.items.map((item: { name: string; amount: number }, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1">
                      Create Transaction
                    </Button>
                    <Button type="button" variant="outline" onClick={handleRetake}>
                      Scan Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
