import React, { useState } from 'react';
import { useFollowAccountMutation, useUnfollowAccountMutation, useFollowVenueMutation, useUnfollowVenueMutation } from '../api/socialApi';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetId: string;
  targetType: 'ACCOUNT' | 'VENUE';
  initialIsFollowing: boolean;
  onOptimisticUpdate?: (isFollowing: boolean) => void;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetId,
  targetType,
  initialIsFollowing,
  onOptimisticUpdate,
  className
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  
  const [followAccount, { isLoading: isFollowingAccount }] = useFollowAccountMutation();
  const [unfollowAccount, { isLoading: isUnfollowingAccount }] = useUnfollowAccountMutation();
  const [followVenue, { isLoading: isFollowingVenue }] = useFollowVenueMutation();
  const [unfollowVenue, { isLoading: isUnfollowingVenue }] = useUnfollowVenueMutation();

  const isLoading = isFollowingAccount || isUnfollowingAccount || isFollowingVenue || isUnfollowingVenue;

  const handleToggle = async () => {
    // 1. Optimistic UI update
    const previousState = isFollowing;
    const newState = !previousState;
    setIsFollowing(newState);
    if (onOptimisticUpdate) onOptimisticUpdate(newState);

    try {
      if (targetType === 'ACCOUNT') {
        if (newState) {
          await followAccount(targetId).unwrap();
        } else {
          await unfollowAccount(targetId).unwrap();
        }
      } else if (targetType === 'VENUE') {
        if (newState) {
          await followVenue(targetId).unwrap();
        } else {
          await unfollowVenue(targetId).unwrap();
        }
      }
    } catch (error) {
      // 2. Rollback on failure
      setIsFollowing(previousState);
      if (onOptimisticUpdate) onOptimisticUpdate(previousState);
      toast.error('Failed to update follow status. Please try again.');
    }
  };

  if (isFollowing) {
    return (
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleToggle} 
        disabled={isLoading}
        className={className}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Following
      </Button>
    );
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleToggle} 
      disabled={isLoading}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Follow
    </Button>
  );
};
