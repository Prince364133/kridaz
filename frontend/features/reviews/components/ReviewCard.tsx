import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import type { ReviewViewModel } from '../types';

interface ReviewCardProps {
  review: ReviewViewModel;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-card border rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {review.author.initials}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">
              {review.author.name} <span className="text-muted-foreground font-normal ml-1">• {review.createdAtFormatted}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
        {review.isEdited && <span className="text-xs text-muted-foreground italic">Edited</span>}
      </div>

      {/* Content */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {review.comment}
        </p>
      )}

      {/* Images (Optional v2) */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {review.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} alt="Review attachment" className="h-16 w-16 object-cover rounded-md border" />
          ))}
        </div>
      )}

      {/* Owner Reply */}
      {review.hasOwnerReply && review.ownerReplyText && (
        <div className="mt-2 bg-muted/60 rounded-lg p-4 border-l-2 border-l-primary flex gap-3 items-start">
          <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-foreground">Response from Venue</span>
              {review.ownerRepliedAtFormatted && (
                <span className="text-xs text-muted-foreground">• {review.ownerRepliedAtFormatted}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground italic">
              &quot;{review.ownerReplyText}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
