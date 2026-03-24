'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md mx-4">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10" />
      
      <Card className="w-full max-w-md shadow-2xl border-slate-200 animate-fade-in">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://avatar.vercel.sh/fintrack" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-4xl font-bold shadow-lg">
                F
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FinTrack
            </CardTitle>
            <CardDescription className="text-lg">
              Kelola keuanganmu dengan bijak
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit mx-auto">
            ✨ Free & Open Source
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span>
                Masuk ke Akun
              </span>
            </Button>
          </Link>
          
          <Link href="/register" className="block">
            <Button variant="outline" className="w-full h-12 text-base font-medium border-2 hover:bg-slate-50 transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                Daftar Baru
              </span>
            </Button>
          </Link>
          
          <Link href="/join" className="block">
            <Button variant="ghost" className="w-full h-12 text-base font-medium hover:bg-slate-100 transition-all">
              <span className="flex items-center justify-center gap-2">
                <span>🎫</span>
                Gabung Wallet
              </span>
            </Button>
          </Link>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="text-2xl">💰</div>
              <p className="text-xs font-medium text-muted-foreground">Track</p>
            </div>
            <div className="text-center space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="text-2xl">📊</div>
              <p className="text-xs font-medium text-muted-foreground">Analytics</p>
            </div>
            <div className="text-center space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="text-2xl">🎯</div>
              <p className="text-xs font-medium text-muted-foreground">Budget</p>
            </div>
          </div>
          
          <Separator className="w-full" />
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            💡 Track income, expense, dan budget dalam satu aplikasi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
