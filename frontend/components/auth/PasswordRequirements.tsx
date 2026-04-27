"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@workspace/common/utils/password-validation";

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

interface RequirementItemProps {
  met: boolean;
  label: string;
  delay: number;
}

const RequirementItem = ({ met, label, delay }: RequirementItemProps) => (
  <motion.li
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.3 }}
    className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
      met ? "text-[#5a9000]" : "text-muted-foreground"
    }`}
  >
    <motion.div
      initial={false}
      animate={{
        scale: met ? [1, 1.2, 1] : 1,
        rotate: met ? [0, 10, 0] : 0,
      }}
      transition={{ duration: 0.3 }}
      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
        met 
          ? "bg-[#A1FF00]/20 text-[#5a9000]" 
          : "bg-muted text-muted-foreground"
      }`}
    >
      {met ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
    </motion.div>
    <span>{label}</span>
  </motion.li>
);

export function PasswordRequirements({ password, className = "" }: PasswordRequirementsProps) {
  const requirements = [
    {
      met: password.length >= PASSWORD_REQUIREMENTS.minLength,
      label: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    },
    {
      met: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
      label: "One uppercase letter",
    },
    {
      met: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
      label: "One lowercase letter",
    },
    {
      met: PASSWORD_REQUIREMENTS.hasNumber.test(password),
      label: "One number",
    },
    {
      met: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
      label: "One special character",
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const progress = (metCount / requirements.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-3 ${className}`}
    >
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-medium ${
            progress === 100 
              ? "text-[#5a9000]" 
              : progress >= 60 
                ? "text-yellow-500" 
                : "text-red-500"
          }`}>
            {progress === 100 ? "Strong" : progress >= 60 ? "Medium" : "Weak"}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full transition-colors duration-300 ${
              progress === 100 
                ? "bg-[#A1FF00]" 
                : progress >= 60 
                  ? "bg-yellow-500" 
                  : "bg-red-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-2">
        {requirements.map((req, index) => (
          <RequirementItem
            key={index}
            met={req.met}
            label={req.label}
            delay={index}
          />
        ))}
      </ul>
    </motion.div>
  );
}
