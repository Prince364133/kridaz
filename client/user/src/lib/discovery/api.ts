import api from '@/lib/api';
import { endpoints } from '@/infrastructure/config/endpoints';
import { 
  GetAvailableSlotsParams, 
  GetVenueAvailableSlotsResponse, 
  VenueDetail, 
  SearchVenuesResponse,
  AvailableSlot
} from './types';

export const DiscoveryApi = {
  searchVenues: async (params: any): Promise<SearchVenuesResponse> => {
    const response = await api.get(endpoints.core.venues.list(), { params });
    return {
      venues: (response.data.turfs || []).map((t: any) => ({
        id: t._id,
        name: t.name,
        slug: t.name.toLowerCase().replace(/ /g, '-'),
        city: t.location,
        primaryPhotoUrl: t.image,
        primarySports: t.sportTypes || [],
        rating: 4.5,
        reviewCount: t.reviews?.length || 0,
        pricePerHour: t.pricePerHour,
        currency: 'INR'
      })),
      pagination: {
        page: 1,
        limit: 100,
        total: response.data.turfs?.length || 0,
        totalPages: 1
      }
    };
  },

  getVenueDetails: async (venueId: string): Promise<VenueDetail> => {
    const response = await api.get(endpoints.core.venues.details(venueId));
    const t = response.data.turf;
    return {
      id: t._id,
      name: t.name,
      slug: t.name.toLowerCase().replace(/ /g, '-'),
      description: t.description,
      address: t.location,
      city: 'Mumbai',
      province: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      latitude: 0,
      longitude: 0,
      primarySports: t.sportTypes || [],
      venueType: 'OUTDOOR',
      totalCourts: 1,
      amenities: ['Parking', 'Water', 'Locker'],
      photos: [{ id: '1', photoUrl: t.image, isPrimary: true }],
      operatingHours: {
        monday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        tuesday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        wednesday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        thursday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        friday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        saturday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
        sunday: { isOpen: true, openTime: t.openTime, closeTime: t.closeTime },
      },
      pricePerHour: t.pricePerHour,
      currency: 'INR',
      rating: 4.5,
      reviewCount: t.reviews?.length || 0
    };
  },

  getVenueAvailableSlots: async (
    venueId: string,
    params: GetAvailableSlotsParams
  ): Promise<GetVenueAvailableSlotsResponse> => {
    const response = await api.get(endpoints.core.venues.slots(venueId, params.startDate));
    const { timeSlots, bookedTime } = response.data;
    
    const slots: AvailableSlot[] = [];
    const open = parseInt(timeSlots.openTime.split(':')[0]);
    const close = parseInt(timeSlots.closeTime.split(':')[0]);
    
    for (let hour = open; hour < close; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      const isBooked = bookedTime?.some((b: any) => b.startTime === startTime);
      
      slots.push({
        id: `${venueId}-${params.startDate}-${startTime}`,
        courtId: 'main-court',
        courtName: 'Main Court',
        startTime: `${params.startDate}T${startTime}:00.000Z`,
        endTime: `${params.startDate}T${endTime}:00.000Z`,
        price: timeSlots.pricePerHour,
        currency: 'INR',
        status: isBooked ? 'BOOKED' : 'AVAILABLE'
      });
    }

    return {
      venueId,
      slotsGroupedByCourt: {
        'main-court': {
          courtName: 'Main Court',
          slots
        }
      }
    };
  },
};
