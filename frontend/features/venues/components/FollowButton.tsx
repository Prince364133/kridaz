"use client";

import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { 
  useFollowVenueMutation, 
  useUnfollowVenueMutation 
} from '@/infrastructure/api/social-graph.api';
import { useAppSelector } from '@/lib/redux/hooks';
import type { RootState } from '@/lib/store';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowButtonProps {
  venueId: string;
  isFollowing: boolean;
  followersCount: number;
  className?: string;
  onStatusChange?: (isFollowing: boolean, newCount: number) => void;
}

/**
 * FollowButton Component
 * Handles following/unfollowing a venue with optimistic updates.
 */
export const FollowButton: React.FC<FollowButtonProps> = ({ 
  venueId, 
  isFollowing, 
  followersCount,
  className,
  onStatusChange
}) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [follow] = useFollowVenueMutation();
  const [unfollow] = useUnfollowVenueMutation();

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Please log in to follow venues", {
        description: "You'll get updates on new events and slots!",
      });
      return;
    }

    try {
      if (isFollowing) {
        // Optimistic update would normally be handled by RTK Query cache manipulation
        // But since we are passing props down, we can also signal the parent
        onStatusChange?.(false, followersCount - 1);
        await unfollow(venueId).unwrap();
        toast.success("Stopped following");
      } else {
        onStatusChange?.(true, followersCount + 1);
        await follow(venueId).unwrap();
        toast.success("Following venue!");
      }
    } catch (error) {
      // Revert on error
      onStatusChange?.(isFollowing, followersCount);
      toast.error("Failed to update follow status");
      console.error("Follow error:", error);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      size="sm"
      className={cn(
        "gap-2 transition-all duration-300 rounded-full h-9 px-4",
        isFollowing 
          ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
          : "hover:bg-primary/5 hover:border-primary/30",
        className
      )}
      onClick={handleToggleFollow}
      aria-label={isFollowing ? "Unfollow venue" : "Follow venue"}
    >
      <motion.div
        animate={isFollowing ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-colors duration-300",
            isFollowing ? "fill-primary text-primary" : "text-muted-foreground"
          )} 
        />
      </motion.div>
      <span className="font-semibold text-xs">
        {isFollowing ? "Following" : "Follow"}
      </span>
      
      {followersCount > 0 && (
        <>
          <span className="h-3 w-[1px] bg-border mx-0.5" />
          <span className="text-xs opacity-70">
            {followersCount >= 1000 
              ? `${(followersCount / 1000).toFixed(1)}k` 
              : followersCount}
          </span>
        </>
      )}
    </Button>
  );
};
