import React from "react";
import { VenueListing } from "@/lib/discovery/types";
import { VenueCard } from "@/components/discovery/VenueCard";

interface VenueListProps {
  venues: VenueListing[];
}

export function VenueList({ venues }: VenueListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
