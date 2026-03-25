'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-pink-200 dark:border-pink-800 overflow-hidden">
        {/* Pink gradient header */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />

        <CardHeader className="space-y-6 text-center pb-2">
          <div className="flex justify-center pt-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 flex items-center justify-center shadow-xl">
              <span className="text-4xl">🤝</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
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
                <Label htmlFor="code" className="text-sm font-medium">Kode Undangan</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABCDEF"
                  value={walletCode}
                  onChange={(e) => setWalletCode(e.target.value.toUpperCase().slice(0, 6))}
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="h-14 rounded-xl bg-background border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500/20 focus-visible:border-pink-500 uppercase tracking-widest text-center text-2xl font-mono font-semibold"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Minta kode ini dari teman atau pasangan Anda
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold cursor-pointer"
                disabled={isLoading || walletCode.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>🔑</span> Verifikasi Kode
                  </span>
                )}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
                  Masuk
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <CardContent className="space-y-5 pt-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background border border-pink-200 dark:border-pink-800">
                <p className="text-sm font-semibold text-foreground">Wallet: {walletName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anda akan melihat semua transaksi dan budget di wallet ini
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-background border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-background border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500/20 focus-visible:border-pink-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Bergabung...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>✨</span> Bergabung
                  </span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 cursor-pointer"
                onClick={() => setStep('code')}
                disabled={isLoading}
              >
                Kembali
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
