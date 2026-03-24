'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuickTransaction from '@/components/transaction/QuickTransaction';

export default function NewTransactionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <QuickTransaction
        onSuccess={() => router.push('/dashboard')}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  );
}
