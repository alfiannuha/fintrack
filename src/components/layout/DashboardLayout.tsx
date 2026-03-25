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
    { href: '/dashboard', label: 'Dashboard', icon: '📊', gradient: 'from-pink-500 to-rose-500' },
    { href: '/transactions', label: 'Transaksi', icon: '💳', gradient: 'from-pink-400 to-rose-400' },
    { href: '/transactions/scan', label: 'Scan', icon: '📷', gradient: 'from-pink-600 to-rose-600' },
    { href: '/budget', label: 'Budget', icon: '🎯', gradient: 'from-pink-500 to-rose-500' },
    { href: '/recurring', label: 'Berulang', icon: '🔄', gradient: 'from-pink-400 to-rose-400' },
    { href: '/report', label: 'Laporan', icon: '📈', gradient: 'from-pink-600 to-rose-600' },
    { href: '/settings', label: 'Setting', icon: '⚙️', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Bottom Navigation - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-pink-200! dark:border-pink-800! bg-background/80 backdrop-blur-xl md:hidden z-50 cursor-pointer">
        <div className="relative h-16">
          {/* Active indicator - Animated pill */}
          <div className="absolute inset-x-0 top-1.5 h-[calc(100%-12px)] mx-4 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 transition-all duration-300" />

          <div className="relative flex h-full items-center justify-between px-2">
            {/* Left side items */}
            <div className="flex items-center justify-center w-16 h-16 cursor-pointer">
              <Link
                href="/dashboard"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/dashboard'
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/dashboard' ? 'scale-110' : 'scale-100'
                )}>📊</span>
              </Link>
            </div>

            <div className="flex items-center justify-center w-16 h-16 cursor-pointer">
              <Link
                href="/transactions"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/transactions'
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 shadow-lg shadow-pink-500/30 rotate-0'
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
              className="relative flex items-center justify-center -mt-10 group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 shadow-2xl shadow-pink-500/40 flex items-center justify-center border-4 border-background transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 cursor-pointer">
                <span className="text-4xl text-white font-bold group-hover:rotate-90 transition-transform duration-300">+</span>
              </div>
            </Link>

            {/* Right side items */}
            <div className="flex items-center justify-center w-16 h-16 cursor-pointer">
              <Link
                href="/budget"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/budget'
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 rotate-0'
                    : 'bg-transparent rotate-12'
                )} />
                <span className={cn(
                  "relative text-2xl transition-all duration-200 z-10 transform group-hover:scale-110",
                  pathname === '/budget' ? 'scale-110' : 'scale-100'
                )}>🎯</span>
              </Link>
            </div>

            <div className="flex items-center justify-center w-16 h-16 cursor-pointer">
              <Link
                href="/settings"
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                <div className={cn(
                  "absolute w-12 h-12 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                  pathname === '/settings'
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 shadow-lg shadow-pink-500/30 rotate-0'
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

      {/* Desktop Sidebar - Compact Modern Design */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-pink-200! dark:border-pink-800! bg-card/80 backdrop-blur-xl z-50 flex-col">
        {/* Logo Section - Compact */}
        <div className="relative p-4 border-b border-pink-200/50! dark:border-pink-800/50!">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-pink-500/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated Logo */}
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-pink-600 via-rose-600 to-pink-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300">
                  <span className="text-xl text-white font-bold">F</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent truncate">
                  FinTrack
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium truncate">Smart Finance</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation - Compact Cards */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative block cursor-pointer"
              >
                <div className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 overflow-hidden",
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 shadow-md shadow-pink-500/10 scale-[1.02]'
                    : 'hover:bg-muted/50 hover:scale-[1.02]'
                )}>
                  {/* Active indicator - Gradient bar */}
                  {isActive && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`} />
                  )}
                  
                  {/* Icon with gradient background - Compact */}
                  <div className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 transform group-hover:scale-110 flex-shrink-0",
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} shadow-md`
                      : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-pink-500/10 group-hover:to-rose-500/20'
                  )}>
                    <span className="text-lg filter drop-shadow-lg">
                      {item.icon}
                    </span>
                  </div>
                  
                  {/* Label - Compact */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-xs font-semibold truncate transition-colors duration-300",
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}>
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className={cn(
                    "transform transition-all duration-300 flex-shrink-0",
                    isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                  )}>
                    <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Card - Compact */}
        <div className="p-3 border-t border-pink-200/50! dark:border-pink-800/50!">
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent border border-pink-200/50! dark:border-pink-800/50! overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-xl" />
            <div className="relative flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xs">FT</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">FinTrack User</p>
                <p className="text-[10px] text-muted-foreground truncate">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="p-3 border-t border-pink-200/50! dark:border-pink-800/50!">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-medium">
              FinTrack v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
