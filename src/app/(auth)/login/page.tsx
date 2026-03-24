'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData);
      toast.success('🎉 Login berhasil! Selamat datang kembali!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200 animate-slide-up">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://avatar.vercel.sh/fintrack" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold">
                F
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-base">
              Masuk untuk melanjutkan ke dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">📧 Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">🔒 Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? '🙈 Sembunyikan' : '👁️ Tampilkan'} password
              </button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Memuat...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🚀</span> Masuk
                </span>
              )}
            </Button>
            
            <div className="text-sm text-center space-y-2 text-muted-foreground">
              <div>
                Belum punya akun?{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Daftar Sekarang
                </Link>
              </div>
              <div>
                Punya kode undangan?{' '}
                <Link href="/join" className="text-primary font-medium hover:underline">
                  Gabung Wallet
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
