'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
      // Verify the wallet code exists
      const response = await api.getWallet();
      // In actual implementation, we'll have a verify endpoint
      // For now, we'll just proceed to the next step
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Gabung Wallet</CardTitle>
          <CardDescription>
            {step === 'code' 
              ? 'Masukkan kode undangan dari teman/pasangan Anda' 
              : `Bergabung dengan ${walletName}`}
          </CardDescription>
        </CardHeader>
        
        {step === 'code' ? (
          <form onSubmit={handleVerifyCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Undangan (6 karakter)</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABCDEF"
                  value={walletCode}
                  onChange={(e) => setWalletCode(e.target.value.toUpperCase().slice(0, 6))}
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="uppercase tracking-widest text-center text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Minta kode ini dari teman atau pasangan Anda
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || walletCode.length !== 6}>
                {isLoading ? 'Memverifikasi...' : 'Verifikasi Kode'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Masuk
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Wallet: {walletName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anda akan melihat semua transaksi dan budget di wallet ini
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Bergabung...' : 'Bergabung'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
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
