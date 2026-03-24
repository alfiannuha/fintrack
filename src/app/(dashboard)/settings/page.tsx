'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { isAuthenticated, user, wallet, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      await logout();
      router.push('/');
    }
  };

  const copyWalletCode = () => {
    if (wallet?.code) {
      navigator.clipboard.writeText(wallet.code);
      alert('Kode wallet berhasil disalin!');
    }
  };

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAyMmMtNS41MzUgMC0xMC00LjQ2NS0xMC0xMHM0LjQ2NS0xMCAxMC0xMCAxMCA0LjQ2NSAxMCAxMC00LjQ2NSAxMC0xMCAxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative">
            <h1 className="text-2xl font-bold">Pengaturan</h1>
            <p className="text-white/80 text-sm mt-1">Kelola akun dan preferensi Anda</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">👤</span> Profil Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-muted-foreground mb-1">Nama Lengkap</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">💼</span> Informasi Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs text-muted-foreground mb-2">Kode Undangan</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{wallet.code}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyWalletCode}
                  className="rounded-lg border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  📋 Salin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Bagikan kode ini kepada pasangan atau keluarga untuk bergabung dengan wallet Anda
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-muted-foreground mb-1">Nama Wallet</p>
                <p className="font-semibold">{wallet.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-muted-foreground mb-1">Anggota</p>
                <p className="font-semibold">{wallet.members?.length || 1} orang</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <span className="text-xl">⚠️</span> Zona Bahaya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Logout dari akun Anda. Anda dapat login kembali kapan saja.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleLogout} 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-semibold"
            >
              🚪 Logout
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">ℹ️</span> Tentang FinTrack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white font-bold">F</span>
              </div>
              <div>
                <p className="font-bold text-lg">FinTrack</p>
                <p className="text-sm text-muted-foreground">Versi 1.0.0 (Phase 2)</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              FinTrack adalah aplikasi pencatatan keuangan personal yang dirancang 
              untuk membantu Anda dan keluarga mengelola keuangan dengan lebih baik. 
              Catat pemasukan dan pengeluaran, buat budget, dan lihat laporan keuangan 
              dengan mudah.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
