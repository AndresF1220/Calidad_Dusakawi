
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DropdownProps } from 'react-day-picker';
import {
  startOfMonth,
  startOfYear,
  getYear,
  setYear,
  getMonth,
  setMonth,
  getDecade,
  add,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const getYears = (fromYear: number, toYear: number) => {
  const years = [];
  for (let i = fromYear; i <= toYear; i++) {
    years.push(i);
  }
  return years;
};

export function CustomCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
  const [displayDate, setDisplayDate] = React.useState(
    props.selected as Date || new Date()
  );

  const currentYear = getYear(displayDate);
  const currentDecade = getDecade(displayDate);
  const fromYear = currentDecade;
  const toYear = fromYear + 9;
  const years = getYears(fromYear, toYear);

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = setMonth(new Date(), i);
    return { value: i, label: format(month, 'MMM', { locale: es }) };
  });

  const handleYearSelect = (year: number) => {
    setDisplayDate(setYear(displayDate, year));
    setView('months');
  };

  const handleMonthSelect = (month: number) => {
    setDisplayDate(setMonth(displayDate, month));
    setView('days');
  };
  
  const handleNextDecade = () => {
      setDisplayDate(add(displayDate, { years: 10 }));
  }

  const handlePrevDecade = () => {
      setDisplayDate(add(displayDate, { years: -10 }));
  }


  return (
    <div>
      <div
        className={cn(
          'p-3',
          view !== 'days' && 'hidden',
          className
        )}
      >
        <DayPicker
          showOutsideDays={showOutsideDays}
          classNames={{
            months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label:
              'text-sm font-medium cursor-pointer hover:bg-accent rounded-md px-2 py-1',
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell:
              'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
            day: cn(
              buttonVariants({ variant: 'ghost' }),
              'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
            ),
            day_range_end: 'day-range-end',
            day_selected:
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground',
            day_outside:
              'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
            day_disabled: 'text-muted-foreground opacity-50',
            day_range_middle:
              'aria-selected:bg-accent aria-selected:text-accent-foreground',
            day_hidden: 'invisible',
            ...classNames,
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            CaptionLabel: ({ displayMonth }) => {
              return (
                <span
                  onClick={() => setView('months')}
                  className="font-medium capitalize cursor-pointer hover:bg-accent rounded-md px-2 py-1"
                >
                  {format(displayMonth, 'MMMM yyyy', { locale: es })}
                </span>
              );
            },
          }}
          month={displayDate}
          onMonthChange={setDisplayDate}
          {...props}
        />
      </div>

      <div className={cn('p-3', view !== 'months' && 'hidden')}>
        <div className="flex justify-between items-center mb-4">
          <div
            onClick={() => setView('years')}
            className="text-sm font-medium cursor-pointer hover:bg-accent rounded-md px-2 py-1"
          >
            {currentYear}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => (
            <button
              key={month.value}
              onClick={() => handleMonthSelect(month.value)}
              className={cn(
                buttonVariants({
                  variant:
                    getMonth(displayDate) === month.value ? 'default' : 'ghost',
                }),
                'w-full capitalize'
              )}
            >
              {month.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('p-3', view !== 'years' && 'hidden')}>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePrevDecade}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'h-7 w-7'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            {fromYear} - {toYear}
          </div>
          <button
            onClick={handleNextDecade}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'h-7 w-7'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={cn(
                buttonVariants({
                  variant:
                    currentYear === year ? 'default' : 'ghost',
                }),
                'w-full'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
CustomCalendar.displayName = 'CustomCalendar';

