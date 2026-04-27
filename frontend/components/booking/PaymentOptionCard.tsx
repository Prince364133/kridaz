"use client";

import React from "react";
import { Wallet, Banknote, Check, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface PaymentOptionCardProps {
  type: "FULL" | "DEPOSIT";
  amount: number;
  totalAmount: number;
  depositAmount?: number;
  isSelected: boolean;
  onSelect: () => void;
  currency?: string;
}

/**
 * Enhanced payment option card with visual comparison and clear benefits.
 */
export function PaymentOptionCard({
  type,
  amount,
  totalAmount,
  depositAmount,
  isSelected,
  onSelect,
  currency = "₹",
}: PaymentOptionCardProps) {
  const isFull = type === "FULL";
  const remainingDue = depositAmount ? totalAmount - depositAmount : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "relative flex flex-col border-2 rounded-xl p-5 cursor-pointer transition-all duration-200",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
        isSelected
          ? isFull
            ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-md"
            : "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 shadow-md"
          : "border-muted-foreground/20 hover:border-muted-foreground/40"
      )}
    >
      {/* Recommended Badge */}
      {isFull && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="h-3 w-3" />
          Recommended
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              isFull
                ? "bg-primary/10 text-primary"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            )}
          >
            {isFull ? (
              <Wallet className="h-6 w-6" />
            ) : (
              <Banknote className="h-6 w-6" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-base">
              {isFull ? "Pay Full Amount" : "Pay Deposit Only"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isFull ? "Complete payment now" : "Secure your slot"}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="text-2xl font-bold">
            {currency}
            {amount.toLocaleString()}
          </p>
          {!isFull && (
            <p className="text-xs text-muted-foreground">
              of {currency}
              {totalAmount.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Benefits List */}
      <div className="mt-4 space-y-2">
        {isFull ? (
          <>
            <BenefitItem positive>Instant confirmation</BenefitItem>
            <BenefitItem positive>Full refund if cancelled (as per policy)</BenefitItem>
            <BenefitItem positive>Nothing to pay at venue</BenefitItem>
          </>
        ) : (
          <>
            <BenefitItem positive>Secure your slot with less upfront</BenefitItem>
            <BenefitItem warning>
              {currency}
              {remainingDue.toLocaleString()} due at venue
            </BenefitItem>
            <BenefitItem warning>Deposit is non-refundable</BenefitItem>
          </>
        )}
      </div>

      {/* Selection Indicator */}
      <div
        className={cn(
          "absolute top-5 right-5 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
          isSelected
            ? isFull
              ? "border-primary bg-primary"
              : "border-amber-500 bg-amber-500"
            : "border-muted-foreground/40"
        )}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>
    </div>
  );
}

/* Helper: Benefit Item */
function BenefitItem({
  children,
  positive,
  warning,
}: {
  children: React.ReactNode;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {positive && (
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      )}
      {warning && (
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      )}
      <span className={cn(warning && "text-amber-700 dark:text-amber-300")}>
        {children}
      </span>
    </div>
  );
}
