'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-md mx-4 border-0 shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

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
            <h1 className="text-3xl font-bold">FinTrack</h1>
            <CardDescription className="text-lg">
              Kelola keuanganmu dengan bijak
            </CardDescription>
          </div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 bg-indigo-950/30 border border-indigo-100 border-indigo-900">
            <span className="text-sm font-medium text-indigo-600 text-indigo-400">✨ Free & Open Source</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span>
                Masuk ke Akun
              </span>
            </Button>
          </Link>
          
          <Link href="/register" className="block">
            <Button variant="outline" className="w-full h-12 text-base font-semibold rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                Daftar Baru
              </span>
            </Button>
          </Link>
          
          <Link href="/join" className="block">
            <Button variant="ghost" className="w-full h-12 text-base font-medium rounded-xl hover:bg-slate-100 transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>🤝</span>
                Gabung Wallet
              </span>
            </Button>
          </Link>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6 pb-6">
          <Separator className="w-full" />
          
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center space-y-1 p-3 rounded-xl bg-slate-50 bg-slate-800/50">
              <div className="text-2xl">💰</div>
              <p className="text-xs font-medium text-muted-foreground">Track</p>
            </div>
            <div className="text-center space-y-1 p-3 rounded-xl bg-slate-50 bg-slate-800/50">
              <div className="text-2xl">📊</div>
              <p className="text-xs font-medium text-muted-foreground">Analytics</p>
            </div>
            <div className="text-center space-y-1 p-3 rounded-xl bg-slate-50 bg-slate-800/50">
              <div className="text-2xl">🎯</div>
              <p className="text-xs font-medium text-muted-foreground">Budget</p>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            💡 Track income, expense, dan budget dalam satu aplikasi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
