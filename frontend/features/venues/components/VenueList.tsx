"use client";

import { useState } from "react";
import VenueCard from "./VenueCard";
import { Button } from "@workspace/ui/components/button";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { VenueListing } from "@/lib/discovery/types";

const INITIAL_VISIBLE_COUNT = 8;

interface VenueListProps {
  venues: VenueListing[];
  loading: boolean;
  error: string | null;
}

export default function VenueList({ venues, loading, error }: VenueListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const handleLoadMore = () => {
    if (venues) {
      setVisibleCount(venues.length);
    }
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const showLoadMoreButton = (venues && visibleCount < venues.length);
  const showShowLessButton = (venues && visibleCount === venues.length && venues.length > INITIAL_VISIBLE_COUNT);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-lg text-muted-foreground">Loading venues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Venues</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!venues || venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Alert variant="default" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertTitle>No Venues Found</AlertTitle>
          <AlertDescription>
            No venues match your current search and filters. Try adjusting your criteria.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 bg-background p-4 sm:p-6 lg:p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {venues.slice(0, visibleCount).map((venue) => (
          <VenueCard
            key={venue.id}
            venue={{
              id: venue.id,
              name: venue.name,
              location: `${venue.city}${venue.province ? `, ${venue.province}` : ''}`,
              sports: venue.primarySports || [],
              rating: venue.rating || 0,
              numberOfReviews: venue.reviewCount || 0,
              imageUrl: venue.primaryPhotoUrl || '/images/default-venue.png', // Fallback image
            }}
          />
        ))}
      </div>
      {(showLoadMoreButton || showShowLessButton) && (
        <div className="mt-4 flex gap-4">
          {showLoadMoreButton && (
            <Button onClick={handleLoadMore} aria-label="Load more venues">
              Load More
            </Button>
          )}
          {showShowLessButton && (
            <Button onClick={handleShowLess} variant="outline" aria-label="Show less venues">
              Show Less
            </Button>
          )}
        </div>
      )}
    </div>
  );
}