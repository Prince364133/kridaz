'use client';

import React from 'react';
import { Loader2, MessageSquareOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVenueReviews } from '../hooks/useVenueReviews';
import { ReviewCard } from './ReviewCard';
import { ReviewCardSkeleton } from './ReviewCardSkeleton';
import { Button } from '@workspace/ui/components/button';

interface ReviewListProps {
  venueId: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ReviewList({ venueId }: ReviewListProps) {
  const { reviews, isInitialLoading, isLoading, isError, loadMore, hasMore } = useVenueReviews(venueId, 5);

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-destructive border rounded-xl bg-destructive/10">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed">
        <MessageSquareOff className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <h3 className="text-lg font-medium text-foreground">No reviews yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
          Be the first to share your experience at this venue with the community.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="grid grid-cols-1 gap-4"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {reviews.map((review) => (
          <motion.div key={review.id} layout variants={itemVariants}>
            <ReviewCard review={review} />
          </motion.div>
        ))}
      </motion.div>
      
      {hasMore && (
         <div className="pt-2 flex justify-center pb-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Reviews'
              )}
            </Button>
         </div>
      )}
    </div>
  );
}
