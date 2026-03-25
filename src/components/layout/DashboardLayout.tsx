'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
    { href: '/transactions', label: 'Transaksi', icon: '💳', gradient: 'from-purple-500 to-pink-500' },
    { href: '/transactions/scan', label: 'Scan Receipt', icon: '📷', gradient: 'from-orange-500 to-red-500' },
    { href: '/budget', label: 'Budget', icon: '🎯', gradient: 'from-green-500 to-emerald-500' },
    { href: '/recurring', label: 'Berulang', icon: '🔄', gradient: 'from-indigo-500 to-purple-500' },
    { href: '/report', label: 'Laporan', icon: '📈', gradient: 'from-yellow-500 to-orange-500' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️', gradient: 'from-slate-500 to-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Bottom Navigation - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl md:hidden z-50">
        <div className="relative h-16">
          {/* Active indicator - Animated pill */}
          <div className="absolute inset-x-0 top-1.5 h-[calc(100%-12px)] mx-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 transition-all duration-300" />

          <div className="relative flex h-full items-center justify-between px-2">
            {/* Left side items */}
            <div className="flex items-center justify-center w-16 h-16">
              <Link
                href="/dashboard"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/dashboard'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/dashboard' ? 'scale-110' : 'scale-100'
                )}>📊</span>
              </Link>
            </div>

            <div className="flex items-center justify-center w-16 h-16">
              <Link
                href="/transactions"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/transactions'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/transactions' ? 'scale-110' : 'scale-100'
                )}>💳</span>
              </Link>
            </div>

            {/* FAB - Center - Floating */}
            <Link
              href="/transactions/new"
              className="relative flex items-center justify-center -mt-10 group"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 shadow-2xl shadow-purple-500/40 flex items-center justify-center border-4 border-background transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <span className="text-4xl text-white font-bold group-hover:rotate-90 transition-transform duration-300">+</span>
              </div>
            </Link>

            {/* Right side items */}
            <div className="flex items-center justify-center w-16 h-16">
              <Link
                href="/budget"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/budget'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/budget' ? 'scale-110' : 'scale-100'
                )}>🎯</span>
              </Link>
            </div>

            <div className="flex items-center justify-center w-16 h-16">
              <Link
                href="/settings"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/settings'
                    ? 'bg-gradient-to-br from-slate-500 to-gray-500 shadow-lg shadow-slate-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/settings' ? 'scale-110' : 'scale-100'
                )}>⚙️</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - Modern Glass Design */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 border-r border-border bg-card/50 backdrop-blur-xl z-50 flex-col">
        {/* Logo Section - Elevated */}
        <div className="relative p-6 border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <span className="text-3xl text-white font-bold">F</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  FinTrack
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Smart Finance</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation - Floating Cards */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative block"
              >
                <div className={cn(
                  "relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden",
                  isActive
                    ? 'bg-gradient-to-r shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'hover:bg-muted/50 hover:scale-[1.02]'
                )}>
                  {/* Active indicator - Gradient bar */}
                  {isActive && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${item.gradient} rounded-r-full`} />
                  )}
                  
                  {/* Background gradient on hover/active */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
                    isActive ? `from-${item.gradient.split(' ')[1]} to-${item.gradient.split(' ')[2]} opacity-10` : 'group-hover:opacity-5'
                  )} />
                  
                  {/* Icon with gradient background */}
                  <div className={cn(
                    "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 transform group-hover:scale-110",
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                      : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-muted-foreground/10 group-hover:to-muted-foreground/20'
                  )}>
                    <span className="text-xl filter drop-shadow-lg">
                      {item.icon}
                    </span>
                  </div>
                  
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-semibold truncate transition-colors duration-300",
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="block text-xs text-muted-foreground font-medium mt-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className={cn(
                    "transform transition-all duration-300",
                    isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                  )}>
                    <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Card - Floating */}
        <div className="p-4 border-t border-border/50">
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">FinTrack User</p>
                <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Minimal */}
        <div className="p-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">
              FinTrack v1.0.0
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Built with ❤️ for Finance
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-72 pb-24 md:pb-8">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
