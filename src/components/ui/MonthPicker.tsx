'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, setMonth, setYear, getMonth, getYear } from 'date-fns';
import { id } from 'date-fns/locale';

interface MonthPickerProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function MonthPicker({ currentMonth, onMonthChange, minDate, maxDate }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const currentDate = React.useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [currentMonth]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: id }),
  }));

  const currentYear = getYear(currentDate);
  const years = React.useMemo(() => {
    const startYear = minDate ? getYear(minDate) : 2020;
    const endYear = maxDate ? getYear(maxDate) : new Date().getFullYear();
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, [minDate, maxDate]);

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    const year = getYear(newDate);
    const month = String(monthIndex + 1).padStart(2, '0');
    onMonthChange(`${year}-${month}`);
    setOpen(false);
  };

  const handleSelectYear = (year: number) => {
    const newDate = setYear(currentDate, year);
    const month = String(getMonth(newDate) + 1).padStart(2, '0');
    onMonthChange(`${year}-${month}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button 
          variant="outline" 
          className="h-10 px-4 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-950/30"
        >
          <span className="font-semibold text-foreground">{format(currentDate, 'MMMM yyyy', { locale: id })}</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Pilih Bulan & Tahun
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Month Grid */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Pilih Bulan</p>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => {
                const isSelected = getMonth(currentDate) === month.value;
                return (
                  <Button
                    key={month.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectMonth(month.value)}
                    className={cn(
                      "cursor-pointer",
                      isSelected 
                        ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white" 
                        : "hover:bg-pink-50 dark:hover:bg-pink-950/30"
                    )}
                  >
                    {month.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Year Selector */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Pilih Tahun</p>
            <div className="grid grid-cols-4 gap-2">
              {years.map((year) => {
                const isSelected = currentYear === year;
                return (
                  <Button
                    key={year}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectYear(year)}
                    className={cn(
                      "cursor-pointer",
                      isSelected 
                        ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white" 
                        : "hover:bg-pink-50 dark:hover:bg-pink-950/30"
                    )}
                  >
                    {year}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
