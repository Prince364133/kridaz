"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Omit conflicting event handlers that conflict with framer-motion
type ButtonPropsWithoutConflicts = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

interface GradientButtonProps extends ButtonPropsWithoutConflicts {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function GradientButton({
  children,
  isLoading = false,
  loadingText,
  variant = "primary",
  size = "md",
  fullWidth = true,
  icon,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-[#A1FF00] via-[#8BE600] to-[#A1FF00]",
      "bg-[length:200%_100%]",
      "text-black font-semibold font-bayon text-lg leading-none",
      "shadow-lg shadow-[#A1FF00]/25",
      "hover:bg-[position:100%_0]",
      "hover:shadow-xl hover:shadow-[#A1FF00]/30",
      "active:shadow-md"
    ),
    secondary: cn(
      "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
      "bg-[length:200%_100%]",
      "text-white font-semibold",
      "shadow-lg shadow-slate-500/25",
      "hover:bg-[position:100%_0]",
      "hover:shadow-xl hover:shadow-slate-500/30"
    ),
    outline: cn(
      "bg-transparent",
      "border-2 border-[#A1FF00]",
      "text-[#5a9000] font-semibold",
      "hover:bg-[#A1FF00]/10",
      "hover:shadow-lg hover:shadow-[#A1FF00]/20"
    ),
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center gap-2",
        "rounded-[8px] font-medium",
        "transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A1FF00] focus-visible:ring-offset-2",
        // Shimmer overlay
        "overflow-hidden",
        // Size
        sizeClasses[size],
        // Variant
        variantClasses[variant],
        // Width
        fullWidth && "w-full",
        // Disabled state
        (disabled || isLoading) && "opacity-70 cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect overlay */}
      {!disabled && !isLoading && variant === "primary" && (
        <span 
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animationTimingFunction: "ease-in-out",
          }}
        />
      )}

      {/* Content */}
      <span className="relative flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{loadingText || "Loading..."}</span>
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </span>
    </motion.button>
  );
}
