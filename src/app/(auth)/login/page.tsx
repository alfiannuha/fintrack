'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-pink-200/50! dark:border-pink-800/50! overflow-hidden">
        {/* Pink gradient header bar */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
        
        <CardHeader className="space-y-4 text-center pt-8 pb-6">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <Avatar className="h-20 w-20 relative">
                <AvatarFallback className="bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 text-white text-4xl font-bold shadow-xl">
                  F
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
              Selamat Datang Kembali
            </CardTitle>
            <CardDescription className="text-base">
              Masuk untuk melanjutkan ke dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">📧 Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                className="h-12 rounded-xl bg-background border-pink-200/50! dark:border-pink-800/50! focus-visible:ring-pink-500/20 focus-visible:border-pink-500!"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="password" className="text-sm font-medium">🔒 Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-background border-pink-200/50 dark:border-pink-800/50 focus-visible:ring-pink-500/20 focus-visible:border-pink-500 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pink-500 hover:text-pink-700 dark:hover:text-pink-300 transition-colors cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-pink-500/25 transition-all duration-300 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                <Link href="/register" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
                  Daftar Sekarang
                </Link>
              </div>
              <div>
                Punya kode undangan?{' '}
                <Link href="/join" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
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
