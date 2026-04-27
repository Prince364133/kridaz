"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  Send,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { TimelineSkeleton } from "./Skeletons";

// ============================================================================
// Types
// ============================================================================

export type TimelineState = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "UNDER_REVIEW" 
  | "CHANGES_REQUESTED" 
  | "APPROVED" 
  | "REJECTED"
  | "RESUBMITTED";

export interface TimelineEvent {
  id: string;
  state: TimelineState;
  title: string;
  description: string;
  timestamp: Date;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function mapBackendStateToTimeline(backendState: string): TimelineState {
  const state = backendState as TimelineState;
  const validStates: TimelineState[] = [
    "DRAFT", "SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED", "RESUBMITTED"
  ];
  return validStates.includes(state) ? state : "DRAFT"; // Fallback to DRAFT if unknown
}

interface ApplicationTimelineProps {
  events: TimelineEvent[];
  currentState?: TimelineState;
  submittedAt?: Date | null;
  estimatedDays?: number;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// State Configuration
// ============================================================================

interface StateConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  lineColor: string;
}

const STATE_CONFIG: Record<TimelineState, StateConfig> = {
  DRAFT: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
    lineColor: "bg-slate-300 dark:bg-slate-600",
  },
  SUBMITTED: {
    icon: <Send className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-400 dark:border-blue-500",
    lineColor: "bg-blue-400 dark:bg-blue-500",
  },
  UNDER_REVIEW: {
    icon: <Eye className="h-4 w-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-400 dark:border-amber-500",
    lineColor: "bg-amber-400 dark:bg-amber-500",
  },
  CHANGES_REQUESTED: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-400 dark:border-orange-500",
    lineColor: "bg-orange-400 dark:bg-orange-500",
  },
  RESUBMITTED: {
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-400 dark:border-indigo-500",
    lineColor: "bg-indigo-400 dark:bg-indigo-500",
  },
  APPROVED: {
    icon: <BadgeCheck className="h-4 w-4" />,
    color: "text-[#A1FF00]",
    bgColor: "bg-[#A1FF00]/10",
    borderColor: "border-[#A1FF00]/50",
    lineColor: "bg-[#A1FF00]",
  },
  REJECTED: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    lineColor: "bg-red-500",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

import { safeFormatDistanceToNow } from '@/lib/date-utils';

function formatRelativeTime(date: Date): string {
  return safeFormatDistanceToNow(date, { addSuffix: true });
}

// ============================================================================
// Timeline Event Component
// ============================================================================

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLast: boolean;
  index: number;
}

function TimelineEventItem({ event, isLast, index }: TimelineEventItemProps) {
  const config = STATE_CONFIG[event.state];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-[19px] top-10 w-0.5 h-[calc(100%-16px)]",
            event.isCompleted ? config.lineColor : "bg-muted"
          )}
        />
      )}

      {/* Icon Circle */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
          event.isCompleted || event.isCurrent ? config.bgColor : "bg-muted",
          event.isCompleted || event.isCurrent ? config.borderColor : "border-muted",
          event.isCurrent && "ring-4 ring-primary/20 animate-pulse"
        )}
      >
        <span className={cn(event.isCompleted || event.isCurrent ? config.color : "text-muted-foreground")}>
          {event.isCompleted ? <CheckCircle className="h-5 w-5" /> : config.icon}
        </span>
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4
            className={cn(
              "font-semibold text-sm",
              event.isCurrent ? "text-foreground" : 
              event.isCompleted ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {event.title}
          </h4>
          {event.isCurrent && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Current
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          {formatRelativeTime(event.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Estimated Time Card
// ============================================================================

interface EstimatedTimeProps {
  submittedAt: Date;
  estimatedDays: number;
  currentState: TimelineState;
}

function EstimatedTimeCard({ submittedAt, estimatedDays, currentState }: EstimatedTimeProps) {
  const now = new Date();
  const daysSinceSubmission = Math.floor(
    (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, estimatedDays - daysSinceSubmission);

  // Don't show for completed states
  if (currentState === "APPROVED" || currentState === "REJECTED") {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-muted/50 rounded-lg p-4 mt-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Estimated Review Time</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-primary">
          {daysRemaining === 0 ? "< 1" : daysRemaining}
        </span>
        <span className="text-sm text-muted-foreground">
          {daysRemaining === 1 ? "day remaining" : "days remaining"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Submitted {daysSinceSubmission} {daysSinceSubmission === 1 ? "day" : "days"} ago
      </p>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ApplicationTimeline({
  events,
  currentState = "DRAFT",
  submittedAt,
  estimatedDays = 3,
  isLoading = false,
  className,
}: ApplicationTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />;
  }
  

  if (!events || events.length === 0) {
    return null;
  }

  // Sort events by timestamp (oldest first)
  const sortedEvents = [...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Application Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {sortedEvents.map((event, index) => (
            <TimelineEventItem
              key={event.id}
              event={event}
              isLast={index === sortedEvents.length - 1}
              index={index}
            />
          ))}
        </div>

        {/* Estimated Time */}
        {submittedAt && currentState && (
          <EstimatedTimeCard
            submittedAt={submittedAt}
            estimatedDays={estimatedDays}
            currentState={currentState}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export Default Mock Data Generator (for development)
// ============================================================================

export function generateMockTimeline(currentState: TimelineState): TimelineEvent[] {
  const now = new Date();
  const states: TimelineState[] = ["SUBMITTED", "UNDER_REVIEW", currentState];
  
  const stateData: Record<TimelineState, { title: string; description: string }> = {
    DRAFT: { title: "Draft Created", description: "Your application draft has been created." },
    SUBMITTED: { title: "Application Submitted", description: "Your application is in the queue for review." },
    UNDER_REVIEW: { title: "Under Review", description: "Our team is reviewing your documents." },
    CHANGES_REQUESTED: { title: "Changes Requested", description: "Please update your application based on our feedback." },
    RESUBMITTED: { title: "Application Resubmitted", description: "Your updated application is being reviewed." },
    APPROVED: { title: "Application Approved", description: "Congratulations! You're now a verified partner." },
    REJECTED: { title: "Application Rejected", description: "Unfortunately, your application was not approved." },
  };

  return states.map((state, index) => {
    const daysAgo = (states.length - 1 - index) * 2;
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return {
      id: `event-${index}`,
      state,
      title: stateData[state].title,
      description: stateData[state].description,
      timestamp,
      isCompleted: index < states.length - 1,
      isCurrent: index === states.length - 1,
    };
  });
}
