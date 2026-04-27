'use client';

/**
 * React hooks for Discovery API
 */

import { useState, useCallback } from 'react';
import { DiscoveryApi } from '../lib/discovery';
import type {
  VenueListing,
  VenueDetail,
  AvailableSlot,
  SlotsGroupedByCourt,
  SearchVenuesParams,
  SearchVenuesResponse,
  GetVenueAvailableSlotsResponse
} from '../lib/discovery/types';

/**
 * Hook for venue search
 */
export function useVenueSearch() {
  const [venues, setVenues] = useState<VenueListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const search = useCallback(async (params: SearchVenuesParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await DiscoveryApi.searchVenues(params); // result is PaginatedResponse<VenueListing>
      // Fix: Handle different response structures
      const items = result.venues || result.items || [];
      setVenues(items);
      setPagination({
        page: result.page || result.pagination?.page || 1,
        limit: result.limit || result.pagination?.limit || 10,
        total: result.total || result.pagination?.total || 0,
        totalPages: result.totalPages || result.pagination?.totalPages || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search venues');
    } finally {
      setLoading(false);
    }
  }, []);

  return { venues, loading, error, pagination, search };
}

/**
 * Hook for venue details
 */
export function useVenueDetails() {
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVenue = useCallback(async (venueId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: VenueDetail = await DiscoveryApi.getVenueDetails(venueId);
      setVenue(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venue');
    } finally {
      setLoading(false);
    }
  }, []);

  return { venue, loading, error, loadVenue };
}

/**
 * Hook for slot availability
 */
export function useSlotAvailability() {
  const [slotsGroupedByCourt, setSlotsGroupedByCourt] = useState<SlotsGroupedByCourt>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async (venueId: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: GetVenueAvailableSlotsResponse = await DiscoveryApi.getVenueAvailableSlots(venueId, { startDate, endDate });
      // Guard against result or slotsGroupedByCourt being null/undefined
      setSlotsGroupedByCourt(result?.slotsGroupedByCourt || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
      setSlotsGroupedByCourt({}); // Reset on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Flatten slots for easy access
  // SAFEGUARD: Ensure slotsGroupedByCourt is an object before calling Object.values
  const allSlots = slotsGroupedByCourt 
    ? Object.values(slotsGroupedByCourt).flatMap(court => court.slots)
    : [];

  return { slotsGroupedByCourt, allSlots, loading, error, loadSlots };
}
