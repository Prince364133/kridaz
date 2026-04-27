// Search Venues Request
export interface SearchVenuesRequest {
  query?: string;
  city?: string;
  sports?: string[];
  amenities?: string[];
  date?: string; // YYYY-MM-DD
  minRating?: number;
  page?: number;
  limit?: number;
}

// Paginated Response Generic
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Nearby Venues Request
export interface GetNearbyVenuesRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}

// Venue With Distance for Nearby Venues
export interface VenueWithDistance extends VenueListing {
  distanceKm: number;
}

// Metadata Amenity
export interface Amenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// Metadata Sport
export interface Sport {
  id: string;
  name: string;
  icon?: string;
}

/**
 * Discovery API Types
 * For venue search and slot availability in player-web
 */

// Venue listing in search results
export interface VenueListing {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  country: string;
  primaryPhotoUrl?: string;
  primarySports: string[];
  sports: string[]; // Added sports
  amenities: string[]; // Added amenities
  rating?: number;
  reviewCount?: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  pricePerHour: number;
  followersCount?: number;
  isFollowing?: boolean;
}

// Detailed venue info
export interface VenueDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  rating?: number; // Added rating
  reviewCount?: number; // Added reviewCount
  address: string; // Flattened
  city: string; // Flattened
  province: string; // Flattened
  country: string; // Flattened
  postalCode: string; // Flattened
  latitude: number; // Flattened
  longitude: number; // Flattened
  primarySports: string[]; // Flattened
  venueType: 'INDOOR' | 'OUTDOOR' | 'HYBRID'; // Flattened
  totalCourts: number; // Flattened
  surfaceType?: string; // Flattened
  maxCapacity?: number; // Flattened
  amenities: string[];
  photos: Array<{
    id: string;
    photoUrl: string;
    isPrimary: boolean;
  }>;
  operatingHours: Record<string, { // Removed optional
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  pricePerHour: number; // Flattened
  currency: string; // Flattened
  contactNumber?: string;
  followersCount?: number;
  isFollowing?: boolean;
}

// Available slot for booking
export interface AvailableSlot {
  id: string; // Changed from slotId to id
  courtId: string;
  courtName: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  price: number;
  currency: string;
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED';
}

// Slots grouped by court
export interface SlotsGroupedByCourt {
  [courtId: string]: {
    courtName: string;
    slots: AvailableSlot[];
  };
}

// API Response types
export interface SearchVenuesResponse {
  venues: VenueListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetVenueAvailableSlotsResponse {
  venueId: string;
  slotsGroupedByCourt: SlotsGroupedByCourt;
}

// Request params for GetVenueAvailableSlots
export interface GetVenueAvailableSlotsRequest {
  date: string; // YYYY-MM-DD
  sportId?: string;
  courtId?: string;
}

// Search params
export interface SearchVenuesParams {
  query?: string;
  city?: string;
  date?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface GetAvailableSlotsParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
