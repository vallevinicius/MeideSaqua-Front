"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePickerProps {
  className?: string;
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

export function DateRangePicker({
  className,
  value,
  onChange,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    {
      label: "Todo o período",
      getValue: () => undefined,
    },
    {
      label: "Hoje",
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: "Últimos 7 dias",
      getValue: () => {
        const today = new Date();
        return { from: subDays(today, 6), to: today };
      },
    },
    {
      label: "Últimos 30 dias",
      getValue: () => {
        const today = new Date();
        return { from: subDays(today, 29), to: today };
      },
    },
    {
      label: "Este mês",
      getValue: () => {
        const today = new Date();
        return { from: startOfMonth(today), to: endOfMonth(today) };
      },
    },
  ];

  const handleSelectPreset = (getRange: () => DateRange | undefined) => {
    onChange(getRange());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const hasSelectedRange = Boolean(value?.from);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 justify-start text-left font-normal bg-white border-gray-200 shadow-sm hover:bg-gray-50 rounded-lg transition-all",
              !hasSelectedRange && "text-gray-600",
              hasSelectedRange && "text-gray-900 font-medium border-blue-200 bg-blue-50/30"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
            {value?.from ? (
              value.to ? (
                <span>
                  {format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })} -{" "}
                  {format(value.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              ) : (
                <span>
                  A partir de {format(value.from, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              )
            ) : (
              <span className="text-gray-700">Todo o período</span>
            )}

            {hasSelectedRange && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Limpar período"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as any);
                  }
                }}
                className="ml-2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 border border-gray-200 shadow-xl rounded-xl bg-white"
          align="end"
        >
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Atalhos Rápidos */}
            <div className="p-3 sm:w-44 flex flex-col gap-1 bg-gray-50/60">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
                Atalhos
              </span>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.getValue)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendário Range */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from || new Date()}
                selected={value}
                onSelect={(range) => {
                  onChange(range);
                  if (range?.from && range?.to) {
                    setIsOpen(false);
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
