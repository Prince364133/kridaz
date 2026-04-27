import React from 'react';
import { useGetAccountFollowersQuery } from '../api/socialApi';
import { EmptyFollowersState } from './EmptyFollowersState';
import { FollowButton } from './FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface FollowerListProps {
  accountId: string;
}

export const FollowerList: React.FC<FollowerListProps> = ({ accountId }) => {
  const { data, isLoading, isError } = useGetAccountFollowersQuery({ accountId });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-sm text-destructive p-4 text-center">Failed to load followers.</div>;
  }

  const followers = data.data;

  if (followers.length === 0) {
    return <EmptyFollowersState />;
  }

  return (
    <div className="space-y-4">
      {followers.map((follow: any) => (
        <div key={follow.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={follow.follower.profilePictureUrl} />
              <AvatarFallback>{follow.follower.name?.substring(0, 2) || 'UU'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{follow.follower.name}</p>
              <p className="text-xs text-muted-foreground">Joined {new Date(follow.follower.createdAt).getFullYear()}</p>
            </div>
          </div>
          <FollowButton 
            targetId={follow.follower.id} 
            targetType="ACCOUNT" 
            initialIsFollowing={false} // Needs actual cross-check against current user in real app
            className="w-24"
          />
        </div>
      ))}
      
      {data.nextCursor && (
        <div className="pt-4 flex justify-center">
          <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Load more...</span>
        </div>
      )}
    </div>
  );
};
