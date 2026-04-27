import React from "react";
import { Link } from "react-router-dom";
import { useRouter } from "@/hooks/useRouter";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  BadgeCheck,
  AlertTriangle,
  XCircle,
  Building,
  ChevronRight,
  ArrowRight,
  Ban,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type OnboardingState = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED" | "SUSPENDED" | "POTENTIAL_DUPLICATE";

interface StatusConfig {
  badge: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const STATUS_CONFIG: Record<OnboardingState, StatusConfig> = {
  DRAFT: {
    badge: "outline",
    icon: <FileText className="h-5 w-5" />,
    label: "Draft",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    description: "Your application is incomplete. Continue to submit.",
  },
  SUBMITTED: {
    badge: "secondary",
    icon: <Clock className="h-5 w-5" />,
    label: "Submitted",
    color: "text-blue-600 dark:text-blue-400", // Keep actionable blue or use primary
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Your application is in the queue for review.",
  },
  UNDER_REVIEW: {
    badge: "secondary",
    icon: <Clock className="h-5 w-5 animate-pulse" />,
    label: "Under Review",
    color: "text-amber-600 dark:text-amber-400", // Standard warning/progress
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "Our team is reviewing your documents. Usually 24-48 hours.",
  },
  APPROVED: {
    badge: "default",
    icon: <BadgeCheck className="h-5 w-5" />,
    label: "Approved",
    color: "text-green-600 dark:text-green-400", // Standard success
    bgColor: "bg-green-100 dark:bg-green-900/30",
    description: "Congratulations! Your venue is live on Owl Turf.",
  },
  CHANGES_REQUESTED: {
    badge: "destructive",
    icon: <AlertTriangle className="h-5 w-5" />,
    label: "Action Required",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    description: "Please update your application based on our feedback to proceed.",
  },
  REJECTED: {
    badge: "destructive",
    icon: <XCircle className="h-5 w-5" />,
    label: "Rejected",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    description: "Your application was not approved. Contact support for details.",
  },
  SUSPENDED: {
    badge: "destructive",
    icon: <Ban className="h-5 w-5" />,
    label: "Suspended",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    description: "Your account has been suspended. Please contact support immediately.",
  },
  POTENTIAL_DUPLICATE: {
    badge: "secondary",
    icon: <Copy className="h-5 w-5" />,
    label: "Potential Duplicate",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    description: "We found a similar account. Our team is verifying details.",
  }
};

interface StatusCardProps {
  state: OnboardingState;
}

export function StatusCard({ state }: StatusCardProps) {
  const { push: pushRoute } = useRouter();
  const config = STATUS_CONFIG[state];

  const getActionButton = () => {
    switch (state) {
      case "DRAFT":
        return (
          <Link to="/partner/onboarding">
            <Button className="font-semibold group">
              Continue Application
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
      case "POTENTIAL_DUPLICATE":
        return (
          <Link to="/partner/status">
            <Button variant="outline" className="font-semibold">
              <Clock className="mr-2 h-4 w-4" />
              View Progress
            </Button>
          </Link>
        );
      case "APPROVED":
        return (
          <Button 
            variant="default"
            className="font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
            onClick={() => /* eslint-disable-next-line no-restricted-syntax */
pushRoute('/partner/venue-dashboard')}
          >
            <Building className="mr-2 h-4 w-4" />
            Go to Venue Dashboard
          </Button>
        );

      case "CHANGES_REQUESTED":
        return (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/partner/onboarding">
              <Button className="font-bold shadow-md shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 text-white">
                Fix Issues & Resubmit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/partner/status">
              <Button variant="outline">View Feedback Details</Button>
            </Link>
          </div>
        );
      case "REJECTED":
      case "SUSPENDED":
        return (
          <Button variant="outline" asChild>
            <Link to="/support/contact">Contact Support</Link>
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardHeader className="text-center pb-2 border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            {/* Status Icon & Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={cn(
                "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center",
                config.bgColor
              )}
            >
              <div className={cn(config.color, "[&>svg]:h-10 [&>svg]:w-10")}>
                {config.icon}
              </div>
            </motion.div>

            <Badge
              variant={config.badge}
              className={cn("text-base font-medium px-4 py-2 mb-4", 
                state === 'CHANGES_REQUESTED' && "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
              )}
            >
              {config.label}
            </Badge>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {config.description}
            </p>

            {/* Action Button */}
            {getActionButton()}

            {/* Progress for review states */}
            {(state === "SUBMITTED" || state === "UNDER_REVIEW" || state === "POTENTIAL_DUPLICATE") && (
              <div className="mt-8 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{state === "SUBMITTED" ? "40%" : "70%"}</span>
                </div>
                <Progress 
                  value={state === "SUBMITTED" ? 40 : 70} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
