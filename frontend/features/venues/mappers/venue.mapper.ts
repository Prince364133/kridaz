import { VenueDetail, VenueListing } from '@/lib/discovery/types';
import { VenueViewModel, VenueListingViewModel } from '../types';

/**
 * Mapper for Venue domain
 */
export const venueMapper = {
  /**
   * Maps VenueDetail DTO to VenueViewModel
   */
  toViewModel: (dto: VenueDetail): VenueViewModel => ({
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    address: dto.address,
    city: dto.city,
    province: dto.province,
    country: dto.country,
    primarySports: dto.primarySports,
    venueType: dto.venueType,
    totalCourts: dto.totalCourts,
    amenities: dto.amenities,
    photos: dto.photos.map(p => ({
      id: p.id,
      photoUrl: p.photoUrl,
      isPrimary: p.isPrimary
    })),
    operatingHours: dto.operatingHours,
    pricePerHour: dto.pricePerHour,
    currency: dto.currency,
    contactNumber: dto.contactNumber,
    
    // Feature-specific
    followersCount: dto.followersCount ?? 0,
    isFollowing: dto.isFollowing ?? false,
  }),

  /**
   * Maps VenueListing DTO to VenueListingViewModel
   */
  toListingViewModel: (dto: VenueListing): VenueListingViewModel => ({
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    city: dto.city,
    primaryPhotoUrl: dto.primaryPhotoUrl,
    primarySports: dto.primarySports,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    pricePerHour: dto.pricePerHour,
    currency: dto.priceRange?.currency || 'INR', // Handled if priceRange is present
    
    // Feature-specific
    followersCount: dto.followersCount ?? 0,
  }),
};
