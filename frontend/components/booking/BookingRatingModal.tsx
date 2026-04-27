"use client";

import React, { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";

interface BookingRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  venueName: string;
}

export function BookingRatingModal({
  isOpen,
  onClose,
  bookingId,
  venueName,
}: BookingRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating star.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Save to local storage to remember this session (demo only)
    try {
        const rated = JSON.parse(localStorage.getItem("rated_bookings") || "[]");
        rated.push(bookingId);
        localStorage.setItem("rated_bookings", JSON.stringify(rated));
    } catch (_e) {
        // ignore
    }

    toast.success("Thank you for your feedback!", {
      description: `Your review for ${venueName} has been submitted.`,
    });

    setIsSubmitting(false);
    onClose();
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
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-sm font-medium text-muted-foreground h-5">
             {(hoveredRating || rating) === 1 && "Poor"}
             {(hoveredRating || rating) === 2 && "Fair"}
             {(hoveredRating || rating) === 3 && "Good"}
             {(hoveredRating || rating) === 4 && "Very Good"}
             {(hoveredRating || rating) === 5 && "Excellent!"}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about the court quality, amenities, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
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
