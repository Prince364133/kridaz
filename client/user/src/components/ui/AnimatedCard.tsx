"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// Animation Variants
// ============================================================================

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// Animated Card Component
// ============================================================================

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverEffect = true, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ delay }}
        whileHover={
          hoverEffect
            ? {
                y: -2,
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.15)",
                transition: { duration: 0.2 },
              }
            : undefined
        }
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

// ============================================================================
// Animated Form Container
// ============================================================================

interface AnimatedFormContainerProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedFormContainer: React.FC<AnimatedFormContainerProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// Animated Form Field
// ============================================================================

interface AnimatedFormFieldProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
};

// ============================================================================
// Step Transition Wrapper
// ============================================================================

interface StepTransitionProps {
  children: React.ReactNode;
  stepKey: string | number;
  direction?: "forward" | "backward";
}

const stepTransitionVariants: Variants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -50 : 50,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

const StepTransition: React.FC<StepTransitionProps> = ({
  children,
  stepKey,
  direction = "forward",
}) => {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={stepTransitionVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export {
  AnimatedCard,
  AnimatedFormContainer,
  AnimatedFormField,
  StepTransition,
};
