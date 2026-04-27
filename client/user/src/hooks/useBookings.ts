'use client';

/**
 * React hooks for Bookings API
 */

import { useState, useCallback } from 'react';
import { BookingsApi } from '../lib/bookings';
import type {
  Booking,
  BookingListItem,
  BookingStatus,
  CreateBookingRequest,
} from '../lib/bookings';

/**
 * Hook for user's bookings list
 */
export function useMyBookings() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const loadBookings = useCallback(async (status?: BookingStatus | BookingStatus[], reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = reset ? 1 : page;
      const result = await BookingsApi.getMyBookings({ 
          status: status ? status : undefined,
          page: currentPage, 
          limit 
      });
      
      if (reset) {
          setBookings(result.data);
          setPage(2); // Next page to fetch
      } else {
          setBookings(prev => [...prev, ...result.data]);
          setPage(prev => prev + 1);
      }
      
      setHasMore(result.data.length === limit); // If we received fewer than limit, we reached the end
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Group bookings by status
  const upcomingBookings = bookings.filter(b => 
    b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT' || b.status === 'PAYMENT_IN_PROGRESS' || b.status === 'PENDING_CONFIRMATION'
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'COMPLETED' || b.status === 'NO_SHOW'
  );
  const cancelledBookings = bookings.filter(b => 
    b.status === 'CANCELLED_BY_PLAYER' || b.status === 'CANCELLED_BY_OWNER' || b.status === 'REFUNDED'
  );

  return { 
    bookings, 
    upcomingBookings, 
    pastBookings, 
    cancelledBookings,
    loading, 
    error, 
    loadBookings,
    hasMore,
    loadMore: () => loadBookings(undefined, false)
  };
}

/**
 * Hook for single booking details
 */
export function useBookingDetails() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await BookingsApi.getBookingDetails(bookingId);
      setBooking(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, []);

  return { booking, loading, error, loadBooking };
}

/**
 * Unified hook for single booking operations
 * Combines details fetching and cancellation
 */
export function useBooking() {
  const { booking: bookingDetails, loading, error, loadBooking } = useBookingDetails();
  const { cancelBooking, loading: isCancelling, error: cancelError } = useCancelBooking();

  return {
    bookingDetails,
    loadBooking,
    cancelBooking,
    loading,
    isCancelling,
    error: error || cancelError,
  };
}

/**
 * Hook for booking creation flow
 */
export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const createBooking = useCallback(async (data: CreateBookingRequest) => {
    setLoading(true);
    setError(null);
    setBookingId(null);
    try {
      const result = await BookingsApi.createBooking(data);
      setBookingId(result.bookingId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createBooking, bookingId, loading, error };
}

/**
 * Hook for payment initiation
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async (
    bookingId: string, 
    paymentType?: 'FULL' | 'DEPOSIT' | 'SPLIT',
    callbackUrl?: string,
    participants?: { email?: string, phone?: string }[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await BookingsApi.initiatePayment(bookingId, paymentType, callbackUrl, participants);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { initiatePayment, loading, error };
}

/**
 * Hook for booking cancellation
 */
export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await BookingsApi.cancelBooking(bookingId, { reason });
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancelBooking, loading, error, success };
}

/**
 * Hook to retrieve specific participant details for the public split-pay landing page
 */
export function useParticipantDetails() {
  const [participantInfo, setParticipantInfo] = useState<{ participant: any, booking: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParticipantDetails = useCallback(async (participantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await BookingsApi.getParticipantDetails(participantId);
      setParticipantInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participant details');
    } finally {
      setLoading(false);
    }
  }, []);

  return { participantInfo, loading, error, loadParticipantDetails };
}
