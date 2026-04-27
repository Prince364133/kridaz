"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { FeedbackSkeleton } from "./Skeletons";

// ============================================================================
// Types
// ============================================================================

export type FeedbackSeverity = "ERROR" | "WARNING" | "INFO";

export interface FeedbackItem {
  id: string;
  noteType: string;
  message: string;
  severity: FeedbackSeverity;
  fieldPath?: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

interface FeedbackDisplayProps {
  feedback: FeedbackItem[];
  ownerState?: string;

  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Severity Configuration
// ============================================================================

interface SeverityConfig {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  label: string;
}

const SEVERITY_CONFIG: Record<FeedbackSeverity, SeverityConfig> = {
  ERROR: {
    icon: <AlertCircle className="h-4 w-4" />,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-400",
    label: "Required",
  },
  WARNING: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-700 dark:text-orange-400",
    label: "Recommended",
  },
  INFO: {
    icon: <Info className="h-4 w-4" />,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-400",
    label: "Suggestion",
  },
};

// ============================================================================
// Field Path Mapping
// ============================================================================

const FIELD_PATH_LABELS: Record<string, string> = {
  businessRegNumber: "Business Registration Number",
  fullLegalName: "Full Legal Name",
  businessName: "Business Name",
  businessType: "Business Type",
  dateOfBirth: "Date of Birth",
  email: "Email Address",
  phone: "Phone Number",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "City",
  state: "State",
  postalCode: "Postal Code",
  country: "Country",
  taxId: "Tax ID / PAN",
  gstNumber: "GST Number",
  bankAccountNumber: "Bank Account Number",
  bankIfscCode: "Bank IFSC Code",
  bankAccountHolderName: "Account Holder Name",
  documents: "Uploaded Documents",
};

function getFieldLabel(fieldPath?: string): string {
  if (!fieldPath) return "General Feedback";
  return FIELD_PATH_LABELS[fieldPath] || fieldPath.replace(/([A-Z])/g, " $1").trim();
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ============================================================================
// Feedback Item Component
// ============================================================================

interface FeedbackItemCardProps {
  item: FeedbackItem;
  index: number;
}

function FeedbackItemCard({ item, index }: FeedbackItemCardProps) {
  const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.INFO;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div
        className={cn(
          "rounded-lg border p-4 transition-all hover:shadow-md",
          item.resolved ? "bg-muted/30 opacity-70" : config.bgColor,
          item.resolved ? "border-muted" : config.borderColor
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              item.resolved ? "bg-green-100 dark:bg-green-900/30" : `${config.bgColor}`
            )}
          >
            {item.resolved ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <span className={config.textColor}>{config.icon}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                {item.fieldPath && (
                  <Badge variant="outline" className="text-xs font-medium">
                    <FileEdit className="h-3 w-3 mr-1" />
                    {getFieldLabel(item.fieldPath)}
                  </Badge>
                )}
                <Badge
                  variant={item.resolved ? "secondary" : "outline"}
                  className={cn(
                    "text-xs",
                    !item.resolved && config.textColor
                  )}
                >
                  {item.resolved ? "Resolved" : config.label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(new Date(item.createdAt))}
              </span>
            </div>

            <p
              className={cn(
                "text-sm",
                item.resolved ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {item.message}
            </p>

            {item.resolved && item.resolvedAt && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Resolved on {formatDate(new Date(item.resolvedAt))}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Summary Stats
// ============================================================================

interface FeedbackSummaryProps {
  feedback: FeedbackItem[];
}

function FeedbackSummary({ feedback }: FeedbackSummaryProps) {
  const unresolvedCount = feedback.filter((f) => !f.resolved).length;
  const errorCount = feedback.filter((f) => f.severity === "ERROR" && !f.resolved).length;
  const warningCount = feedback.filter((f) => f.severity === "WARNING" && !f.resolved).length;

  if (unresolvedCount === 0) {
    return (
      <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          All feedback items have been addressed. You can resubmit your application.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">{errorCount} required change{errorCount !== 1 ? "s" : ""}</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">{warningCount} recommendation{warningCount !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FeedbackDisplay({
  feedback,
  ownerState,

  isLoading = false,
  className,
}: FeedbackDisplayProps) {
  if (isLoading) {
    return <FeedbackSkeleton />;
  }

  const unresolvedItems = feedback.filter((f) => !f.resolved);
  if (unresolvedItems.length === 0) {
    return null;
  }

  // Sort feedback: unresolved first, then by severity (ERROR > WARNING > INFO), then by date
  const sortedFeedback = [...feedback].sort((a, b) => {
    // Unresolved first
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    
    // By severity
    const severityOrder = { ERROR: 0, WARNING: 1, INFO: 2 };
    const aSeverity = severityOrder[a.severity as FeedbackSeverity] ?? 3;
    const bSeverity = severityOrder[b.severity as FeedbackSeverity] ?? 3;
    if (aSeverity !== bSeverity) return aSeverity - bSeverity;
    
    // By date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unresolvedFeedback = sortedFeedback.filter((f) => !f.resolved);
  const resolvedFeedback = sortedFeedback.filter((f) => f.resolved);

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
              Changes Requested
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Please address the following feedback before resubmitting
            </CardDescription>
          </div>
          {ownerState === "CHANGES_REQUESTED" && (
            <Link to="/partner/onboarding" className="w-full sm:w-auto">
              <Button className="group w-full sm:w-auto">
                Update Application
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <FeedbackSummary feedback={feedback} />

        {/* Unresolved Feedback */}
        {unresolvedFeedback.length > 0 && (
          <div className="space-y-3">
            {unresolvedFeedback.map((item, index) => (
              <FeedbackItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Resolved Feedback (collapsed by default in future) */}
        {resolvedFeedback.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">
              Resolved ({resolvedFeedback.length})
            </h4>
            {resolvedFeedback.map((item, index) => (
              <FeedbackItemCard
                key={item.id}
                item={item}
                index={unresolvedFeedback.length + index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
