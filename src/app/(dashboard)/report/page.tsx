'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan Bulanan</h1>
          <p className="text-muted-foreground">Analisis keuangan bulanan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🚧 Dalam Pengembangan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Fitur laporan bulanan akan segera hadir. Fitur ini akan menampilkan:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Ringkasan pemasukan dan pengeluaran</li>
              <li>Perbandingan dengan bulan sebelumnya</li>
              <li>Breakdown per kategori dengan persentase</li>
              <li>Top 3 kategori pengeluaran terbesar</li>
              <li>Export ke PDF atau CSV</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
