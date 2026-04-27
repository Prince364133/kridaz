import React from 'react';

export function ReviewCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 bg-card border rounded-xl shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-3 w-20 bg-muted/60 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-[90%] bg-muted rounded"></div>
        <div className="h-4 w-[40%] bg-muted rounded"></div>
      </div>
    </div>
  );
}
