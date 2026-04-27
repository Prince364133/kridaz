'use client';

import React from 'react';
import { ReviewList } from './ReviewList';

interface VenueReviewSectionProps {
  venueId: string;
}

export function VenueReviewSection({ venueId }: VenueReviewSectionProps) {
  return (
    <section className="mt-8 pt-8 border-t" id="reviews">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Player Reviews</h2>
          <p className="text-muted-foreground mt-1">
            See what others have to say about this venue
          </p>
        </div>
        {/* Placeholder for Aggregate summary (e.g., 4.8 Stars) */}
      </div>

      <ReviewList venueId={venueId} />
    </section>
  );
}
