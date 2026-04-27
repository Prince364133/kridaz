"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Clock, ChevronRight, LayoutDashboard, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useGetOnboardingStatusQuery } from "@/lib/redux/features/owner/ownerApi";
import { cn } from "@workspace/ui/lib/utils";
import { useGenerateHandoffTokenMutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";

interface BadgeConfig {
  label: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ElementType;
  variant: 'outline' | 'default' | 'secondary' | 'destructive';
  className: string;
  pulse: boolean;
  external?: boolean;
}

/**
 * Partner Application Badge Component
 */
export function PartnerApplicationBadge() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  
  // Use RTK Query hook
  const { data: status, isLoading: statusLoading, isError: isStatusError } = useGetOnboardingStatusQuery(undefined, { 
    skip: !isAuthenticated,
    // Provide a polling interval or refetch behavior if needed, but standard behavior usually suffices
  });
  
  const [generateHandoffToken, { isLoading: isGeneratingToken }] = useGenerateHandoffTokenMutation();
  
  // If not authenticated, don't show anything
  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton ONLY while truly loading
  // If auth is loading, OR status is loading (first fetch)
  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  // If loading finished but user is missing (error in getMe), hide badge
  if (!user) {
      return null;
  }
  
  // If status query failed, hide badge or show default?
  // If it failed, likely backend issue. Hide for now.
  if (isStatusError) {
      return null;
  }

  const { role } = user;
  
  // Don't show for regular players or admins unless they have an owner identity
  if (role === 'PLAYER' && !status?.hasOwnerIdentity) {
      return null;
  }
  if (role === 'OWLTP_ADMIN') {
    return null;
  }

  const handleHandoff = async () => {
    try {
      const { token, nonce } = await generateHandoffToken({ targetApp: 'venue-owner-web' }).unwrap();
      const venueOwnerUrl = process.env.NEXT_PUBLIC_VENUE_OWNER_WEB_URL || 'http://localhost:3001';
      window.location.href = `${venueOwnerUrl}/handoff?token=${token}&nonce=${nonce}`;
    } catch (error) {
      console.error("Handoff failed", error);
      toast.error("Failed to access dashboard");
    }
  };

  const getBadgeConfig = (): BadgeConfig | null => {
    // Priority: Approved/Verified -> Changes Requested -> Submitted/Review -> Draft/Prospect
    
    if (role === 'VERIFIED_VENUE_OWNER' || status?.ownerState === 'APPROVED') {
        return {
          label: 'Go to Dashboard',
          description: 'Access your venue dashboard',
          action: handleHandoff,
          icon: LayoutDashboard,
          variant: 'default',
          className: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent',
          pulse: false,
        };
    }

    const state = status?.ownerState;

    if (state === 'CHANGES_REQUESTED') {
         return {
          label: 'Action Required',
          description: 'Please update your application',
          href: '/partner/status',
          icon: AlertCircle,
          variant: 'destructive',
          className: 'border-destructive/50 text-destructive hover:bg-destructive/10',
          pulse: true,
        };
    }

    if (state === 'SUBMITTED' || state === 'UNDER_REVIEW' || state === 'POTENTIAL_DUPLICATE') {
        return {
          label: 'In Review',
          description: 'Your application is being reviewed',
          href: '/partner/status',
          icon: Clock,
          variant: 'outline',
          className: 'border-blue-500/50 text-blue-500 hover:bg-blue-500/10',
          pulse: false,
        };
    }

    // Default for prospect/draft
    // Check if user has explicit PROSPECT_OWNER role or just hasOwnerIdentity
    if (role === 'PROSPECT_OWNER' || status?.hasOwnerIdentity) {
         return {
          label: 'Continue Application',
          description: 'Continue your partner journey',
          href: '/partner/onboarding',
          icon: Building2,
          variant: 'outline',
          className: 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10',
          pulse: false,
        };
    }

    return null;
  };

  const config = getBadgeConfig();
  
  if (!config) {
    return null;
  }

  const { label, href, action, icon: Icon, variant, className, pulse, external } = config;

  const badgeContent = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Badge
        variant={variant}
        className={cn(
          "cursor-pointer transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5",
          className,
          pulse && "animate-pulse"
        )}
      >
        {isGeneratingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
        <span className="text-xs font-medium">{label}</span>
        {!isGeneratingToken && <ChevronRight className="h-3 w-3 opacity-60" />}
      </Badge>
    </motion.div>
  );

  if (action) {
    return (
      <div onClick={action}>
        {badgeContent}
      </div>
    );
  }

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {badgeContent}
      </a>
    );
  }

  return (
    <Link href={href || '#'}>
      {badgeContent}
    </Link>
  );
}

interface CardConfig {
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  buttonText: string;
  external?: boolean;
}

/**
 * Compact version for mobile menu
 */
export function PartnerApplicationBadgeMobile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  // Use RTK Query hook
  const { data: status, isLoading: statusLoading, isError: isStatusError } = useGetOnboardingStatusQuery(undefined, { 
    skip: !isAuthenticated,
  });
  
  const [generateHandoffToken, { isLoading: isGeneratingToken }] = useGenerateHandoffTokenMutation();
  
  if (!isAuthenticated) return null;

  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 animate-pulse">
        <div className="p-2 rounded-full bg-muted sticky left-0">
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user || isStatusError) {
      return null;
  }

  const { role } = user;
  
   if (role === 'PLAYER' && !status?.hasOwnerIdentity) {
      return null;
  }
  if (role === 'OWLTP_ADMIN') {
    return null;
  }

  const handleHandoff = async () => {
    try {
      const { token, nonce } = await generateHandoffToken({ targetApp: 'venue-owner-web' }).unwrap();
      const venueOwnerUrl = process.env.NEXT_PUBLIC_VENUE_OWNER_WEB_URL || 'http://localhost:3001';
      window.location.href = `${venueOwnerUrl}/handoff?token=${token}&nonce=${nonce}`;
    } catch (error) {
      console.error("Handoff failed", error);
      toast.error("Failed to access dashboard");
    }
  };

  const getCardConfig = (): CardConfig | null => {
      if (role === 'VERIFIED_VENUE_OWNER' || status?.ownerState === 'APPROVED') {
        return {
          title: 'Venue Dashboard',
          description: 'Manage your venue, bookings, and more',
          action: handleHandoff,
          icon: LayoutDashboard,
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/30',
          iconColor: 'text-primary',
          buttonText: 'Go to Dashboard',
        };
      }

      const state = status?.ownerState;

      if (state === 'CHANGES_REQUESTED') {
         return {
          title: 'Action Required',
          description: 'Please update your application details',
          href: '/partner/status',
          icon: AlertCircle,
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          iconColor: 'text-destructive',
          buttonText: 'View Details',
        };
      }

      if (state === 'SUBMITTED' || state === 'UNDER_REVIEW' || state === 'POTENTIAL_DUPLICATE') {
        return {
          title: 'Application In Review',
          description: 'Our team is reviewing your application',
          href: '/partner/status',
          icon: Clock,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-500',
          buttonText: 'View Status',
        };
      }
      
      if (role === 'PROSPECT_OWNER' || status?.hasOwnerIdentity) {
        return {
          title: 'Partner Application',
          description: 'Continue your journey to become a venue partner',
          href: '/partner/onboarding',
          icon: Building2,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          iconColor: 'text-amber-500',
          buttonText: 'Continue Application',
        };
      }

      return null;
  };
   
  const config = getCardConfig();
  
  if (!config) {
    return null;
  }

  const { title, description, href, action, icon: Icon, bgColor, borderColor, iconColor, external } = config;

  const content = (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]",
      bgColor,
      borderColor,
      isGeneratingToken && "opacity-70 pointer-events-none"
    )}>
      <div className={cn("p-2 rounded-full", bgColor)}>
        {isGeneratingToken ? <Loader2 className={cn("h-4 w-4 animate-spin", iconColor)} /> : <Icon className={cn("h-4 w-4", iconColor)} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-white/60 truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40" />
    </div>
  );

  if (action) {
    return (
      <div onClick={action} className="block cursor-pointer">
        {content}
      </div>
    );
  }

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link href={href || '#'}>
      {content}
    </Link>
  );
}