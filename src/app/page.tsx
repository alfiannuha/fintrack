'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background">
        <Card className="w-full max-w-md mx-4 border-pink-200! dark:border-pink-800!">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-medium">Loading...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/10 to-rose-300/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-pink-200! dark:border-pink-800! relative z-10 overflow-hidden animate-fade-in bg-white dark:bg-pink-950/5">
        {/* Pink gradient header bar */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
        
        <CardHeader className="space-y-6 text-center pt-8 pb-6">
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300">
                <span className="text-5xl text-white font-bold">F</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                FinTrack
              </CardTitle>
              <Badge variant="secondary" className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-xs">
                v1.0
              </Badge>
            </div>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Kelola keuanganmu dengan bijak dan mudah
            </CardDescription>
          </div>
          
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300">
              ✨ Free
            </Badge>
            <Badge variant="outline" className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300">
              🚀 Fast
            </Badge>
            <Badge variant="outline" className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300">
              🔒 Secure
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pb-6 bg-white dark:bg-pink-950/10">
          <Link href="/login" className="block group">
            <Button className="w-full h-14 text-base font-semibold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:via-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-pink-500/25 transition-all duration-300 cursor-pointer">
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">🔐</span>
                <span>Masuk ke Akun</span>
              </span>
            </Button>
          </Link>
          
          <Link href="/register" className="block group">
            <Button variant="outline" className="w-full h-14 text-base font-semibold border-2 border-pink-300 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300 cursor-pointer">
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">✨</span>
                <span>Daftar Baru</span>
              </span>
            </Button>
          </Link>
          
          <Link href="/join" className="block group">
            <Button variant="ghost" className="w-full h-14 text-base font-medium hover:bg-pink-100 dark:hover:bg-pink-950/50 text-pink-700 dark:text-pink-300 transition-all duration-300 cursor-pointer">
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">🎫</span>
                <span>Gabung Wallet</span>
              </span>
            </Button>
          </Link>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6 border-t border-pink-100! dark:border-pink-900! bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background">
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center space-y-2 p-3 rounded-xl bg-white dark:bg-pink-950/30 border border-pink-100! dark:border-pink-800!">
              <div className="text-2xl">💰</div>
              <p className="text-xs font-semibold text-foreground">Track</p>
              <p className="text-[10px] text-muted-foreground">Income & Expense</p>
            </div>
            <div className="text-center space-y-2 p-3 rounded-xl bg-white dark:bg-pink-950/30 border border-pink-100! dark:border-pink-800!">
              <div className="text-2xl">📊</div>
              <p className="text-xs font-semibold text-foreground">Analytics</p>
              <p className="text-[10px] text-muted-foreground">Charts & Reports</p>
            </div>
            <div className="text-center space-y-2 p-3 rounded-xl bg-white dark:bg-pink-950/30 border border-pink-100! dark:border-pink-800!">
              <div className="text-2xl">🎯</div>
              <p className="text-xs font-semibold text-foreground">Budget</p>
              <p className="text-[10px] text-muted-foreground">Control Spending</p>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            💡 Track income, expense, dan budget dalam satu aplikasi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
