'use client';

import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSubmitReview } from '../hooks/useVenueReviews';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  venueName: string;
}

export function SubmitReviewModal({
  isOpen,
  onClose,
  bookingId,
  venueName,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const { submitReview, isSubmitting } = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating star.');
      return;
    }

    try {
      await submitReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
        // images: [] // Omitted for V1
      });

      toast.success('Review submitted successfully!', {
        description: `Thank you for sharing your experience at ${venueName}.`,
      });
      
      onClose();
    } catch (error: any) {
      toast.error('Failed to submit review', {
        description: error?.data?.message || 'Please try again later.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>
            How was your game at <span className="font-semibold text-foreground">{venueName}</span>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-sm font-medium text-muted-foreground h-5">
             {(hoveredRating || rating) === 1 && 'Poor'}
             {(hoveredRating || rating) === 2 && 'Fair'}
             {(hoveredRating || rating) === 3 && 'Good'}
             {(hoveredRating || rating) === 4 && 'Very Good'}
             {(hoveredRating || rating) === 5 && 'Excellent!'}
          </div>

          <div className="grid gap-2 mt-2">
            <Label htmlFor="comment">Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about the court quality, amenities, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
