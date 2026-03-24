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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-2xl border border-slate-200">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <CardHeader className="space-y-6 text-center pb-2">
          <div className="flex justify-center pt-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
              <span className="text-4xl text-white font-bold">F</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground">
              Masuk untuk melanjutkan ke dashboard
            </p>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
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
                className="h-12 rounded-xl border-slate-200 border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2 mb-3">
              <Label htmlFor="password" className="text-sm font-medium ml-1">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-slate-200 border-slate-700 focus:ring-2 focus:ring-indigo-500/20 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-5 pt-2 pb-6">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
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
                <Link href="/register" className="text-indigo-600 text-indigo-400 font-medium hover:underline">
                  Daftar Sekarang
                </Link>
              </div>
              <div>
                Punya kode undangan?{' '}
                <Link href="/join" className="text-indigo-600 text-indigo-400 font-medium hover:underline">
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
