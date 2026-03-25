'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, wallet, logout } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    toast.success('Logout berhasil');
  };

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
            Pengaturan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola akun dan preferensi
          </p>
        </div>

        <Separator className="border-pink-200/50! dark:border-pink-800/50!" />

        {/* Profile Card */}
        <Card className="border-pink-smooth shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profil Saya</CardTitle>
            <CardDescription>Informasi akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl font-bold text-white bg-transparent">
                  💰
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <Separator className="border-pink-200/50! dark:border-pink-800/50!" />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Lengkap</p>
                <p className="font-medium text-foreground">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info Card */}
        <Card className="border-pink-smooth shadow-soft bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Wallet Info</CardTitle>
            <CardDescription>Informasi wallet Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">{wallet.code.charAt(0)}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Kode Undangan</p>
                <p className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-400">{wallet.code}</p>
                <p className="text-xs text-muted-foreground">
                  Bagikan kode ini kepada pasangan atau keluarga untuk bergabung
                </p>
              </div>
            </div>
            
            <Separator className="border-pink-200/50! dark:border-pink-800/50!" />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Wallet</p>
                <p className="font-medium text-foreground">{wallet.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Members</p>
                <p className="font-medium text-foreground">{wallet.members?.length || 1} member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-red-200/50 dark:border-red-800/50 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">Zona Bahaya</CardTitle>
            <CardDescription>Aksi yang perlu perhatian</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <span>🚪</span> Logout
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* App Info Card */}
        <Card className="border-pink-smooth shadow-soft bg-gradient-to-br from-pink-50/50 via-rose-50/50 to-white dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Tentang FinTrack</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Versi:</span>
              <span>1.0.0 (Phase 3)</span>
            </div>
            <Separator className="border-pink-200/50! dark:border-pink-800/50!" />
            <p>
              FinTrack adalah aplikasi pencatatan keuangan personal yang dirancang
              untuk membantu Anda mengelola keuangan dengan lebih baik.
            </p>
            <div className="flex gap-2 pt-2">
              <span className="text-lg">💖</span>
              <span className="text-lg">📊</span>
              <span className="text-lg">🎯</span>
              <span className="text-lg">💰</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
