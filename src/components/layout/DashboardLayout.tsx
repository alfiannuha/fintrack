'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/transactions', label: 'Transaksi', icon: '💳' },
    { href: '/budget', label: 'Budget', icon: '🎯' },
    { href: '/recurring', label: 'Berulang', icon: '🔄' },
    { href: '/report', label: 'Laporan', icon: '📈' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 md:hidden z-50">
        <div className="relative h-16">
          {/* Active indicator background */}
          <div className="absolute inset-x-0 top-1.5 h-[calc(100%-12px)] mx-3 rounded-2xl bg-slate-100 dark:bg-slate-800 transition-all duration-300" />
          
          <div className="relative flex h-full items-end justify-around pb-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center w-16 h-14 -mb-0.5"
                >
                  {/* Active indicator */}
                  <div 
                    className={cn(
                      "absolute top-1 w-10 h-10 rounded-2xl transition-all duration-300",
                      isActive 
                        ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' 
                        : 'bg-transparent'
                    )}
                  />
                  <span 
                    className={cn(
                      "relative text-xl transition-all duration-200 z-10",
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span 
                    className={cn(
                      "relative text-[10px] font-medium transition-all duration-200 z-10 -mt-0.5",
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r bg-white dark:bg-slate-900 p-4 z-50 flex-col">
        {/* Logo */}
        <div className="mb-8 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white font-bold">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">FinTrack</h1>
              <p className="text-xs text-muted-foreground">Kelola Keuangan</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-center text-muted-foreground">
            FinTrack v1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
