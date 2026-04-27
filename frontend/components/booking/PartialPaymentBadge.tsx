"use client";

import React from "react";
import { Wallet, AlertCircle } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface PartialPaymentBadgeProps {
  amountPaid: number;
  totalAmount: number;
  currency?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Enhanced badge showing partial payment status with circular progress indicator.
 * Shows what's paid and what's due at venue.
 */
export function PartialPaymentBadge({
  amountPaid,
  totalAmount,
  currency = "₹",
  className,
  compact = false,
}: PartialPaymentBadgeProps) {
  const remainingDue = totalAmount - amountPaid;
  const percentPaid = Math.round((amountPaid / totalAmount) * 100);
  
  // SVG circle dimensions
  const size = compact ? 40 : 52;
  const strokeWidth = compact ? 4 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentPaid / 100) * circumference;

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700",
          "text-amber-800 dark:text-amber-200",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currency}{remainingDue.toLocaleString()} due at venue
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20",
        "border border-amber-200 dark:border-amber-800",
        className
      )}
    >
      {/* Progress Circle */}
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-amber-200 dark:text-amber-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-emerald-500 dark:text-emerald-400 transition-all duration-500"
          />
        </svg>
        {/* Percentage in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
            {percentPaid}%
          </span>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {currency}{remainingDue.toLocaleString()} Due at Venue
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Paid: {currency}{amountPaid.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            Total: {currency}{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
