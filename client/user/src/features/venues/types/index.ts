/**
 * ViewModel for the Venue Details view.
 * Strictly decoupled from backend DTOs.
 */
export interface VenueViewModel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  address: string;
  city: string;
  province: string;
  country: string;
  primarySports: string[];
  venueType: 'INDOOR' | 'OUTDOOR' | 'HYBRID';
  totalCourts: number;
  amenities: string[];
  photos: Array<{
    id: string;
    photoUrl: string;
    isPrimary: boolean;
  }>;
  operatingHours: Record<string, {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  pricePerHour: number;
  currency: string;
  contactNumber?: string;
  
  // Feature-specific fields
  followersCount: number;
  isFollowing: boolean;
}

/**
 * Simplified ViewModel for venue lists/cards
 */
export interface VenueListingViewModel {
  id: string;
  name: string;
  slug: string;
  city: string;
  primaryPhotoUrl?: string;
  primarySports: string[];
  rating?: number;
  reviewCount?: number;
  pricePerHour: number;
  currency: string;
  
  // Feature-specific fields
  followersCount: number;
}
