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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">F</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">FinTrack</CardTitle>
          <CardDescription>
            Pencatatan keuangan personal yang cepat dan mudah
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/login">
            <Button className="w-full">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="w-full">Daftar Baru</Button>
          </Link>
          <Link href="/join">
            <Button variant="ghost" className="w-full">Gabung Wallet</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
