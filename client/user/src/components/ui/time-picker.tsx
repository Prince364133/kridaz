"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "./input";

interface TimePickerProps {
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Basic validation for HH:MM format
      if (inputValue.length === 2 && !inputValue.includes(":")) {
        inputValue += ":";
      } else if (inputValue.length > 5) {
        inputValue = inputValue.substring(0, 5);
      }

      // Allow only numbers and colon
      inputValue = inputValue.replace(/[^0-9:]/g, "");

      if (onChange) {
        onChange(inputValue);
      }
    };

    return (
      <Input
        type="text"
        placeholder="HH:MM"
        maxLength={5}
        className={cn("w-[100px]", className)}
        value={value}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);

TimePicker.displayName = "TimePicker";
