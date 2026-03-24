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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-primary-foreground">F</span>
          </div>
          <CardTitle className="text-3xl font-bold">FinTrack</CardTitle>
          <CardDescription>
            Kelola keuanganmu dengan bijak
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full">Masuk</Button>
          </Link>
          <Link href="/register" className="block">
            <Button variant="outline" className="w-full">Daftar Baru</Button>
          </Link>
          <Link href="/join" className="block">
            <Button variant="ghost" className="w-full">Gabung Wallet</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
