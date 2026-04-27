import api from '@/lib/api';
import { endpoints } from '@/infrastructure/config/endpoints';

export const BookingsApi = {
  createBooking: async (data: any): Promise<any> => {
    // This will actually initiate the Razorpay order in our backend
    const response = await api.post(endpoints.core.bookings.createOrder(), data);
    return response.data;
  },

  getBookingDetails: async (bookingId: string): Promise<any> => {
    const response = await api.get(endpoints.core.bookings.details(bookingId));
    return response.data;
  },

  initiatePayment: async (
    bookingId: string, 
    paymentType?: 'FULL' | 'DEPOSIT' | 'SPLIT',
    callbackUrl?: string,
    participants?: any[]
  ): Promise<any> => {
    const response = await api.post(endpoints.core.bookings.initiatePayment(), {
      bookingId,
      paymentType,
      callbackUrl,
      participants
    });
    return response.data;
  },

  cancelBooking: async (bookingId: string, data: any): Promise<any> => {
    const response = await api.post(endpoints.core.bookings.cancel(bookingId), data);
    return response.data;
  },

  getParticipantDetails: async (participantId: string): Promise<any> => {
    const response = await api.get(endpoints.core.bookings.participant(participantId));
    return response.data;
  },

  verifyPayment: async (data: any): Promise<any> => {
    const response = await api.post(endpoints.core.bookings.verifyPayment(), data);
    return response.data;
  },

  handlePaymentCallback: async (data: any): Promise<any> => {
    // This is often the same as verifyPayment in many implementations
    const response = await api.post(endpoints.core.bookings.verifyPayment(), data);
    return response.data;
  },

  getMyBookings: async (params?: any): Promise<any> => {
    const response = await api.get(endpoints.core.bookings.my(), { params });
    return response.data;
  },
};

export default BookingsApi;
