"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTime?: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function clampHour(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(23, Math.floor(n)));
}

function clampMinute(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(59, Math.floor(n)));
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const currentDate = value ?? null;

  const hour = currentDate ? currentDate.getHours() : 0;
  const minute = currentDate ? currentDate.getMinutes() : 0;

  const handleSelect = (day: Date | undefined) => {
    if (!day) {
      onChange(null);
      return;
    }
    const next = new Date(day);
    if (currentDate) {
      next.setHours(currentDate.getHours());
      next.setMinutes(currentDate.getMinutes());
    } else {
      next.setHours(0);
      next.setMinutes(0);
    }
    next.setSeconds(0);
    next.setMilliseconds(0);
    onChange(next);
  };

  const updateTime = (h: number, m: number) => {
    const base = currentDate ?? new Date();
    const next = new Date(base);
    next.setHours(clampHour(h));
    next.setMinutes(clampMinute(m));
    next.setSeconds(0);
    next.setMilliseconds(0);
    onChange(next);
  };

  const display = currentDate
    ? showTime
      ? format(currentDate, "yyyy-MM-dd HH:mm")
      : format(currentDate, "yyyy-MM-dd")
    : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start font-normal",
              !currentDate && "text-[var(--muted)]"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {display || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <DayPicker
            mode="single"
            selected={currentDate ?? undefined}
            onSelect={handleSelect}
            className="rdp-root"
          />
        </PopoverContent>
      </Popover>
      {showTime ? (
        <div className="flex items-center gap-1">
          <Label htmlFor="dt-hour" className="sr-only">
            Hour
          </Label>
          <Input
            id="dt-hour"
            type="number"
            min={0}
            max={23}
            value={currentDate ? pad(hour) : ""}
            disabled={disabled || !currentDate}
            onChange={(e) => updateTime(Number(e.target.value), minute)}
            className="h-9 w-14 text-center"
            placeholder="HH"
          />
          <span className="text-[var(--muted)]">:</span>
          <Label htmlFor="dt-minute" className="sr-only">
            Minute
          </Label>
          <Input
            id="dt-minute"
            type="number"
            min={0}
            max={59}
            value={currentDate ? pad(minute) : ""}
            disabled={disabled || !currentDate}
            onChange={(e) => updateTime(hour, Number(e.target.value))}
            className="h-9 w-14 text-center"
            placeholder="MM"
          />
        </div>
      ) : null}
    </div>
  );
}
