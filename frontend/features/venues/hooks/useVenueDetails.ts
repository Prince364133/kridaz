"use client";

import { useState, useEffect, useCallback } from 'react';
import { DiscoveryApi } from '@/lib/discovery/api';
import { AvailableSlot } from '@/lib/discovery/types';
import { venueMapper } from '../mappers/venue.mapper';
import { VenueViewModel } from '../types';
import { toast } from 'sonner';

/**
 * Hook to manage venue details data and mapping.
 * Aligns with enterprise architecture by handling DTO -> ViewModel conversion.
 */
export function useVenueDetails(venueId: string) {
  const [venue, setVenue] = useState<VenueViewModel | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVenueData = useCallback(async () => {
    if (!venueId) return;
    
    setLoading(true);
    try {
      // 1. Fetch DTO
      const venueDto = await DiscoveryApi.getVenueDetails(venueId);
      
      // 2. Map to ViewModel
      const venueViewModel = venueMapper.toViewModel(venueDto);
      setVenue(venueViewModel);

      // 3. Fetch Slots (for current date - logic could be moved here too)
      // For now, we'll keep slot fetching in the component or move it later
    } catch (err: any) {
      console.error("Error fetching venue details:", err);
      setError(err);
      toast.error("Failed to load venue details");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueData();
  }, [fetchVenueData]);

  // Handle manual updates (e.g. from FollowButton optimistic update)
  const updateFollowStatus = (isFollowing: boolean, followersCount: number) => {
    setVenue(prev => prev ? { ...prev, isFollowing, followersCount } : null);
  };

  return {
    venue,
    loading,
    error,
    updateFollowStatus,
    refresh: fetchVenueData
  };
}
