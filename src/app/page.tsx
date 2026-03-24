'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 glass animate-scale-in border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mb-2">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
              <span className="text-4xl font-bold text-white">F</span>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
            FinTrack
          </CardTitle>
          <CardDescription className="text-purple-100 text-lg">
            Kelola Keuanganmu Dengan Bijak
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <Button 
            asChild 
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            <Link href="/login">
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span> Masuk ke Akun
              </span>
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full h-12 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
          >
            <Link href="/register">
              <span className="flex items-center justify-center gap-2">
                <span>✨</span> Daftar Baru
              </span>
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="ghost" 
            className="w-full h-12 text-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <Link href="/join">
              <span className="flex items-center justify-center gap-2">
                <span>🎫</span> Gabung Wallet
              </span>
            </Link>
          </Button>

          <div className="pt-4 mt-4 border-t border-white/20">
            <p className="text-xs text-center text-purple-200">
              💡 Track income, expense, dan budget dalam satu aplikasi
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white/80">
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs font-medium">Track Finance</div>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-medium">Analytics</div>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs font-medium">Budget Plan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
