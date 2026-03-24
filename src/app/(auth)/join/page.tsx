'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function JoinPage() {
  const router = useRouter();
  const { join } = useAuth();
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [isLoading, setIsLoading] = useState(false);
  const [walletCode, setWalletCode] = useState('');
  const [walletName, setWalletName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate verification - in real app would call API
      setWalletName('Wallet ' + walletCode.toUpperCase());
      setStep('details');
    } catch (error) {
      console.error('Verify code error:', error);
      toast.error('Kode wallet tidak valid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await join({
        code: walletCode.toUpperCase(),
        name: formData.name,
        email: formData.email,
      });
      toast.success('Berhasil bergabung dengan wallet!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Join error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal bergabung');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-2xl border border-slate-200">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <CardHeader className="space-y-6 text-center pb-2">
          <div className="flex justify-center pt-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
              <span className="text-4xl">🤝</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {step === 'code' ? 'Gabung Wallet' : 'Isi Data Diri'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'code' 
                ? 'Masukkan kode undangan dari teman/pasangan Anda' 
                : `Bergabung dengan ${walletName}`}
            </p>
          </div>
        </CardHeader>
        
        {step === 'code' ? (
          <form onSubmit={handleVerifyCode}>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium ml-1">Kode Undangan</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABCDEF"
                  value={walletCode}
                  onChange={(e) => setWalletCode(e.target.value.toUpperCase().slice(0, 6))}
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest text-center text-2xl font-mono"
                />
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Minta kode ini dari teman atau pasangan Anda
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-5 pt-2 pb-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading || walletCode.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memverifikasi...
                  </span>
                ) : (
                  'Verifikasi Kode'
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  Masuk
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <CardContent className="space-y-4 pt-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Wallet: {walletName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anda akan melihat semua transaksi dan budget di wallet ini
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium ml-1">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 mb-4"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-5 pt-2 pb-6">
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('code')}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700"
                >
                  Kembali
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>🤝</span> Bergabung
                    </span>
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
