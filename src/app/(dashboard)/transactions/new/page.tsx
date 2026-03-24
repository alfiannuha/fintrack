'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuickTransaction from '@/components/transaction/QuickTransaction';

export default function NewTransactionPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <QuickTransaction
          onSuccess={() => router.push('/dashboard')}
          onCancel={() => router.push('/dashboard')}
        />
      </div>
    </DashboardLayout>
  );
}
