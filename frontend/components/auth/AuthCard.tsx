"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function AuthCard({
  children,
  className,
  title,
  description,
}: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        // Base styles
        "w-full rounded-2xl p-6 sm:p-8",
        // Glassmorphism effect
        "bg-card/80 dark:bg-card/60",
        "backdrop-blur-xl",
        "border border-border/50",
        // Shadow
        "shadow-2xl shadow-black/5 dark:shadow-black/20",
        // Hover effect
        "transition-all duration-300",
        "hover:shadow-3xl hover:shadow-black/10 dark:hover:shadow-black/30",
        className
      )}
    >
      {/* Card Header */}
      {(title || description) && (
        <motion.div
          className="text-center mb-6 space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {title && (
            <h1 className="text-2xl font-bold tracking-tight font-bayon group-hover:text-[#A1FF00] transition-colors">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {description}
            </p>
          )}
        </motion.div>
      )}

      {/* Card Content */}
      {children}
    </motion.div>
  );
}
