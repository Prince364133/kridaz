import { config } from '@/lib/config';

export const env = {
  // Using the validated zod parser from lib/config as the source of truth,
  // which internally checks import.meta.env.VITE_API_URL
  CORE_SERVICE_URL: config.api.baseUrl,
  
  // Future microservices go here:
  // BILLING_SERVICE_URL: import.meta.env.VITE_BILLING_API,
};
