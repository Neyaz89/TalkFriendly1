/**
 * Slider component — used in mood check-in for energy/stress/sleep levels.
 */

"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  valueLabel?: (value: number) => string;
  trackColor?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, valueLabel, value, trackColor = "bg-primary-500", ...props }, ref) => {
  const currentValue = Array.isArray(value) ? value[0] : (value as number[] | undefined)?.[0] ?? 5;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">{label}</span>
          {valueLabel && (
            <span className="text-sm font-semibold text-primary">
              {valueLabel(currentValue)}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100">
          <SliderPrimitive.Range className={cn("absolute h-full rounded-full", trackColor)} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-5 w-5 rounded-full border-2 border-primary-500 bg-white shadow-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-110 cursor-grab active:cursor-grabbing"
          aria-label={label}
        />
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
