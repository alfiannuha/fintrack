'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 rounded-xl bg-background/50 backdrop-blur-sm border-border"
        disabled
      >
        <div className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="relative group cursor-pointer">
      {/* Glow effect - Pink theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-pink-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Button container */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-background via-background to-pink-500/20 backdrop-blur-xl border-pink-200 dark:border-pink-800 hover:border-pink-400 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* Animated background gradient - Pink theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Rotating ring animation - Pink theme */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-pink-500/30 opacity-0 group-hover:opacity-100 animate-spin-slow" />
        
        {/* Sun icon */}
        <Sun 
          className={cn(
            "absolute h-5 w-5 transition-all duration-500",
            theme === 'dark' 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100 text-pink-600 dark:text-pink-400"
          )}
        />
        
        {/* Moon icon */}
        <Moon 
          className={cn(
            "absolute h-5 w-5 transition-all duration-500",
            theme === 'dark'
              ? "rotate-0 scale-100 opacity-100 text-pink-400"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        
        {/* Sparkle effect on hover - Pink theme */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1 right-1 w-1 h-1 bg-pink-400 rounded-full animate-ping" />
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-rose-400 rounded-full animate-ping delay-100" />
          <div className="absolute top-1 left-1 w-0.5 h-0.5 bg-pink-300 rounded-full animate-ping delay-200" />
        </div>
        
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
