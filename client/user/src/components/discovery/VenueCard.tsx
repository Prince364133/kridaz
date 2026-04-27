"use client";

import React from "react";
import { Link } from "react-router-dom";
const Image = (props: any) => <img {...props} />;
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { VenueListing } from "@/lib/discovery/types";

interface VenueCardProps {
  venue: VenueListing;
}

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <Link to={`/venues/${venue.slug}`}>
      <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 cursor-pointer">
        <div className="relative w-full h-48">
          <Image
            src={venue.primaryPhotoUrl || "/placeholder-venue.jpg"} // Placeholder image
            alt={venue.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex items-center bg-background/80 px-2 py-1 rounded-full text-sm font-semibold">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span>{venue.rating ? venue.rating.toFixed(1) : "N/A"}</span>
          </div>
        </div>
        <div className="p-4 bg-background">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
            {venue.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center mt-1 truncate">
            <MapPin className="w-4 h-4 mr-1" />
            {venue.city}, {venue.province}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {venue.sports.slice(0, 2).map((sport: string, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {sport}
              </Badge>
            ))}
            {venue.sports.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{venue.sports.length - 2}
              </Badge>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">
              ₹{venue.pricePerHour}
            </span>
            <span className="text-sm text-muted-foreground">/ hour</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
