'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { isAuthenticated, user, wallet, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola akun dan preferensi</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Saya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Kode Undangan</p>
              <p className="font-mono text-lg font-bold">{wallet.code}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bagikan kode ini kepada pasangan atau keluarga untuk bergabung
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Wallet</p>
              <p className="font-medium">{wallet.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Zona Bahaya</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              🚪 Logout
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>Tentang FinTrack</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Versi: 1.0.0 (Phase 2)</p>
            <p className="mt-2">
              FinTrack adalah aplikasi pencatatan keuangan personal yang dirancang
              untuk membantu Anda mengelola keuangan dengan lebih baik.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
