import { env } from './env';

// NOTE: NEXT_PUBLIC_API_BASE_URL already includes the version prefix (e.g. /api/v1).
// Do NOT append API_VERSION here — that produces a double /v1/v1 path.
export const API_VERSION = 'v1';

export const services = {
  // env.CORE_SERVICE_URL is the primary API base URL.
  core: env.CORE_SERVICE_URL,
  // billing: env.BILLING_SERVICE_URL,  ← add future services the same way
} as const;

export type ServiceName = keyof typeof services;
