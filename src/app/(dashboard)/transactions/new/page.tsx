'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuickTransaction from '@/components/transaction/QuickTransaction';

export default function NewTransactionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-background flex items-center justify-center p-4">
      <QuickTransaction
        onSuccess={() => router.push('/dashboard')}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  );
}
