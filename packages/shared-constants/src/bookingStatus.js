/**
 * @fileoverview Booking lifecycle status constants shared between server and client.
 *
 * Usage:
 *   import { BOOKING_STATUS, PAYMENT_STATUS } from '@kridaz/shared-constants/bookingStatus';
 */

/**
 * All possible booking states.
 * @type {Readonly<Record<string, string>>}
 */
export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  NO_SHOW: 'no_show',
});

/**
 * Payment transaction states.
 * @type {Readonly<Record<string, string>>}
 */
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

/**
 * Wallet top-up / withdrawal transaction types.
 * @type {Readonly<Record<string, string>>}
 */
export const WALLET_TRANSACTION_TYPE = Object.freeze({
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
  WITHDRAWAL: 'withdrawal',
  TOPUP: 'topup',
});
