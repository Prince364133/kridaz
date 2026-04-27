import api from '@/lib/api'; // Assuming a shared Axios/fetch instance
import { GetAvailableSlotsParams, GetVenueAvailableSlotsResponse, GetNearbyVenuesRequest, VenueWithDistance, SearchVenuesRequest, Amenity, Sport, VenueDetail, SearchVenuesResponse } from './types';

const BASE_URL = '/discovery';

// --- Interfaces for Request/Response Payloads ---
// (These should ideally be shared types from a common package, similar to @workspace/common/dtos or @workspace/common/schema)



/**
 * API client for the Discovery module.
 */
export const DiscoveryApi = {
  /**
   * Searches for venues based on various criteria.
   */
  searchVenues: async (params: SearchVenuesRequest): Promise<SearchVenuesResponse> => {
    const response = await api.get(`${BASE_URL}/venues`, { params });
    return response.data;
  },

  /**
   * Fetches venues near a given geographical location.
   */
  getNearbyVenues: async (params: GetNearbyVenuesRequest): Promise<VenueWithDistance[]> => {
    const response = await api.get(`${BASE_URL}/venues/nearby`, { params });
    return response.data;
  },

  /**
   * Fetches detailed information for a single venue by ID.
   */
  getVenueDetails: async (venueId: string): Promise<VenueDetail> => {
    const response = await api.get(`${BASE_URL}/venues/${venueId}`);
    return response.data;
  },

  /**
   * Fetches detailed information for a single venue by slug.
   */
  getVenueDetailsBySlug: async (slug: string): Promise<VenueDetail> => {
    const response = await api.get(`${BASE_URL}/venues/slug/${slug}`);
    return response.data;
  },

  /**
   * Fetches available slots for a given venue and date.
   */
  getVenueAvailableSlots: async (
    venueId: string,
    params: GetAvailableSlotsParams
  ): Promise<GetVenueAvailableSlotsResponse> => { // Corrected return type
    const response = await api.get(`${BASE_URL}/venues/${venueId}/slots`, { params });
    return response.data;
  },

  /**
   * Fetches all available amenities.
   */
  getAllAmenities: async (): Promise<Amenity[]> => {
    const response = await api.get(`${BASE_URL}/amenities`);
    return response.data;
  },

  /**
   * Fetches all available sports.
   */
  getAllSports: async (): Promise<Sport[]> => {
    const response = await api.get(`${BASE_URL}/sports`);
    return response.data;
  },
};