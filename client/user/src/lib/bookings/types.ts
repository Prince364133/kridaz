/**
 * Bookings API Types
 * For player booking operations in player-web
 */

// Booking status enum
export type BookingStatus = 
  | 'PENDING_PAYMENT'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PENDING_CONFIRMATION'
  | 'REJECTED'
  | 'CANCELLED_BY_PLAYER'
  | 'CANCELLED_BY_OWNER'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'DISPUTED';

// Payment status type
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'REFUNDED';

// Booking entity
export interface Booking {
  id: string;
  playerId: string;
  slotId: string;
  venueId: string;
  courtId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  totalAmount: number;
  amountPaid: number;
  currency: string;
  playerNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated details
  venueName?: string;
  venueCity?: string;
  venueAddress?: string;
  venueContact?: string;
  locationLink?: string;
  bookingReference: string;
  sportName?: string;
  courtName?: string;
  price?: number;
  // OTP Verification (Digital Handshake)
  verificationCode?: string | null;
  verificationCodeExpiry?: string | null;
  verifiedAt?: string | null;
  // Group Bookings
  participants?: {
    id: string;
    email?: string;
    phone?: string;
    status: 'INVITED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CASH_COLLECTION';
    shareAmount: number;
    paymentTransactionId?: string | null;
  }[];
}

// My bookings list item (lighter version)
export interface BookingListItem {
  id: string;
  venueId?: string; // Added for navigation
  venueName: string;
  venueCity: string;
  courtName: string;
  sport: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  amountPaid: number; // Added for partial payment visibility
  paymentStatus: PaymentStatus; // Added for partial payment visibility
  currency: string;
}

// Create booking request
export interface CreateBookingRequest {
  slotId: string;
  playerNotes?: string;
  totalPrice?: number;
  selectedSlots?: { id: string; price: number }[];
}

// Create booking response
export interface CreateBookingResponse {
  bookingId: string;
  status: BookingStatus;
  message?: string;
  totalAmount: number;
  depositAmount?: number;
  allowPartialPayment: boolean;
  reservationExpiry?: string;
}

// Cancel booking request
export interface CancelBookingRequest {
  reason?: string;
}

// Initiate payment response
export interface InitiatePaymentResponse {
  orderId: string; // Razorpay/Stripe order ID
  amount: number;
  currency: string;
  keyId: string; // Public key for payment gateway
  checkoutUrl?: string; // URL to redirect user for payment
}

export interface HandlePaymentCallbackRequest {
  paymentId: string;
  orderId: string;
  status: string; // "success" | "failure"
  signature?: string; // For Razorpay
  payload?: unknown; // Raw payload from gateway
  metadata?: Record<string, unknown>; // Extra metadata (e.g. for Payment Links)
}

// Query params for getMyBookings
// Query params for getMyBookings
export interface GetMyBookingsParams {
  status?: BookingStatus | BookingStatus[];
  page?: number;
  limit?: number;
}

export interface PaginatedBookingsResponse {
  data: BookingListItem[];
  total: number;
  page: number;
  limit: number;
}
