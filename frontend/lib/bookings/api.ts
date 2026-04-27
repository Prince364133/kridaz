/**
 * Bookings API Client
 * Authenticated booking operations for players
 */

import {
  Booking,
  CreateBookingRequest,
  CreateBookingResponse,
  CancelBookingRequest,
  InitiatePaymentResponse,
  HandlePaymentCallbackRequest, // New import
  GetMyBookingsParams,
  PaginatedBookingsResponse,
} from './types';
import { config } from '@/lib/config';

const BASE_URL = `${config.api.baseUrl}/bookings`;

/**
 * Fetch wrapper with authentication
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for auth
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Bookings API methods
 */
export const BookingsApi = {
  /**
   * Create a new booking for a slot
   */
  createBooking: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
    return fetchApi('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user's bookings
   */
  getMyBookings: async (params?: GetMyBookingsParams): Promise<PaginatedBookingsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      const statusArray = Array.isArray(params.status) ? params.status : [params.status];
      queryParams.append('status', statusArray.join(','));
    }
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return fetchApi(`/my?${queryParams.toString()}`);
  },

  /**
   * Get booking details by ID
   */
  getBookingDetails: async (bookingId: string): Promise<Booking> => {
    return fetchApi(`/${bookingId}`);
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string, data?: CancelBookingRequest): Promise<void> => {
    return fetchApi(`/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  /**
   * Get refund estimate for a booking before cancellation
   */
  getRefundEstimate: async (bookingId: string): Promise<{
    refundAmount: number;
    refundPercent: number;
    cancellationFee: number;
    reason: string;
    amountPaid: number;
    totalAmount: number;
  }> => {
    return fetchApi(`/${bookingId}/refund-estimate`);
  },

  /**
   * Initiate payment for a booking

   * Returns payment gateway order details
   */
  /**
   * Initiate payment for a booking
   * Returns payment gateway order details
   */
  initiatePayment: async (
    bookingId: string, 
    paymentType: 'FULL' | 'DEPOSIT' | 'SPLIT' = 'FULL', 
    callbackUrl?: string,
    participants?: { email?: string, phone?: string }[]
  ): Promise<InitiatePaymentResponse> => {
    return fetchApi(`/${bookingId}/payment/initiate`, {
      method: 'POST',
      body: JSON.stringify({ paymentType, callbackUrl, participants }),
    });
  },

  /**
   * Handles payment gateway callback to update booking/payment status.
   */
  handlePaymentCallback: async (data: HandlePaymentCallbackRequest): Promise<void> => {
    return fetchApi(`/payment/callback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get specific participant details
   * Used for the public split-pay landing page
   */
  getParticipantDetails: async (participantId: string): Promise<{ participant: unknown, booking: Booking }> => {
    return fetchApi(`/participants/${participantId}`);
  },

  /**
   * Generate verification code for at-venue payment collection
   * Returns 6-digit OTP for Digital Handshake verification
   */
  generateVerificationCode: async (bookingId: string): Promise<{ verificationCode: string; expiresAt: string }> => {
    return fetchApi(`/${bookingId}/generate-verification-code`, {
      method: 'POST',
    });
  },
};

export default BookingsApi;
