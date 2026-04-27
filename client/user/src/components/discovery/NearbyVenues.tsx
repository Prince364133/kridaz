"use client";

import React, { useState, useEffect } from "react"; // Add React import
import { DiscoveryApi } from "@/lib/discovery/api";
import { VenueWithDistance } from "@/lib/discovery/types"; // Corrected import source
import { Loader2, Frown, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { VenueCard } from "@/components/discovery/VenueCard";

export function NearbyVenues() {
  const [nearbyVenues, setNearbyVenues] = useState<VenueWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearby = async (lat: number, lon: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await DiscoveryApi.getNearbyVenues({
          latitude: lat,
          longitude: lon,
          limit: 5,
        });
        setNearbyVenues(response);
      } catch (err) {
        console.error("Failed to fetch nearby venues:", err);
        setError("Could not load nearby venues.");
        toast.error("Failed to load nearby venues.");
      } finally {
        setLoading(false);
      }
    };

    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchNearby(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.warn(`Geolocation error(${err.code}): ${err.message}`);
            setError("Location access denied or unavailable. Showing general venues.");
            toast.warning("Location access denied or unavailable.");
            setLoading(false);
            // Optionally, fall back to a default location search
          }
        );
      } else {
        setError("Geolocation not supported by your browser. Showing general venues.");
        toast.warning("Geolocation not supported.");
        setLoading(false);
        // Optionally, fall back to a default location search
      }
    };

    getUserLocation();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Finding venues near you...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground py-8">
        <MapPin className="h-5 w-5" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (nearbyVenues.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground py-8">
        <Frown className="h-5 w-5" />
        <p className="text-sm">No venues found nearby.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {nearbyVenues.map((venue: VenueWithDistance) => (
          <div key={venue.id} className="w-[300px] inline-block">
            <VenueCard venue={venue} />
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
