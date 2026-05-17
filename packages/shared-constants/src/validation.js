/**
 * @fileoverview Shared validation patterns and helper functions used by both
 * the server (Zod schemas) and client (Yup/react-hook-form schemas).
 *
 * Usage:
 *   import { PHONE_REGEX, isValidIndianPhone } from '@kridaz/shared-constants/validation';
 *
 *   // In a Zod schema (server):
 *   phone: z.string().regex(PHONE_REGEX, "Phone must be 10 digits")
 *
 *   // In a Yup schema (client):
 *   phone: yup.string().matches(PHONE_REGEX, "Enter a valid 10-digit phone number")
 *
 *   // Imperative check (both):
 *   if (!isValidIndianPhone(input)) throw new Error(...)
 */

// ── Regex Patterns ────────────────────────────────────────────────────────────

/** 10-digit Indian mobile number — no country code prefix */
export const PHONE_REGEX = /^[0-9]{10}$/;

/** 6-digit Indian PIN code */
export const PIN_REGEX = /^[0-9]{6}$/;

/** Standard RFC-5322-derived email check (same as Zod's .email()) */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Username: 3–20 chars, alphanumeric + underscores only, no spaces.
 * Mirrors the check-username endpoint's validation logic.
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Returns true if the given string is a valid 10-digit Indian phone number.
 * @param {string} value
 * @returns {boolean}
 */
export const isValidIndianPhone = (value) => PHONE_REGEX.test(value);

/**
 * Returns true if the given string looks like a valid email address.
 * @param {string} value
 * @returns {boolean}
 */
export const isValidEmail = (value) => EMAIL_REGEX.test(value);

/**
 * Returns true if the given string is a valid Kridaz username.
 * @param {string} value
 * @returns {boolean}
 */
export const isValidUsername = (value) => USERNAME_REGEX.test(value);

/**
 * Returns true if the given string is a valid Indian PIN code.
 * @param {string} value
 * @returns {boolean}
 */
export const isValidPinCode = (value) => PIN_REGEX.test(value);
