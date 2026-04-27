import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';

interface EmptyFollowersStateProps {
  onExploreVenues?: () => void;
}

export const EmptyFollowersState: React.FC<EmptyFollowersStateProps> = ({ onExploreVenues }) => {
  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-muted/50 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Welcome to your Network</CardTitle>
        <CardDescription>
          It looks a bit quiet here. Start connecting with the community!
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Following coaches, venues, and other players helps you discover new matches, exclusive slots, and local tournaments.
        </p>
        
        <div className="flex flex-col space-y-2 mt-4">
          <Button onClick={onExploreVenues} className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            Discover Top Rated Venues
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
