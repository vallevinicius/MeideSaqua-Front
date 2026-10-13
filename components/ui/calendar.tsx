"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-gray-800",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 text-gray-500 opacity-70 hover:opacity-100 hover:bg-gray-100 border-gray-200"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-400 rounded-md w-9 font-medium text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-outside)]:bg-blue-50/40 [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-700 aria-selected:opacity-100 transition-colors"
        ),
        day_range_start:
          "day-range-start !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white rounded-l-md font-semibold shadow-sm",
        day_range_end:
          "day-range-end !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white rounded-r-md font-semibold shadow-sm",
        day_selected:
          "!bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white focus:!bg-blue-600 focus:!text-white font-semibold shadow-sm",
        day_today: "bg-blue-50 text-blue-700 font-bold border border-blue-200",
        day_outside:
          "day-outside text-gray-300 opacity-25 aria-selected:bg-blue-100/40 aria-selected:text-gray-400 aria-selected:opacity-30 pointer-events-none select-none",
        day_disabled: "text-gray-300 opacity-40",
        day_range_middle:
          "aria-selected:!bg-blue-100 aria-selected:!text-blue-900 !rounded-none font-medium",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
