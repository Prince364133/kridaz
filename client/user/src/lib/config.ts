import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url({ message: "VITE_API_URL must be a valid URL" }),
  VITE_RAZORPAY_KEY_ID: z.string().optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_VENUE_OWNER_WEB_URL: z.string().url().optional().default('http://localhost:3001'),
  
  // Firebase
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  // Features
  VITE_API_MOCKING: z.string().optional(),
  
  MODE: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
  VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  VITE_VENUE_OWNER_WEB_URL: import.meta.env.VITE_VENUE_OWNER_WEB_URL,
  
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

  VITE_API_MOCKING: import.meta.env.VITE_API_MOCKING,
  
  MODE: import.meta.env.MODE,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const config = {
  api: {
    baseUrl: _env.data.VITE_API_URL,
  },
  razorpay: {
    keyId: _env.data.VITE_RAZORPAY_KEY_ID || 'rzp_test_SiJWPw3RX4jJB1',
  },
  push: {
    vapidKey: _env.data.VITE_VAPID_PUBLIC_KEY,
  },
  firebase: {
    apiKey: _env.data.VITE_FIREBASE_API_KEY,
    authDomain: _env.data.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: _env.data.VITE_FIREBASE_PROJECT_ID,
    storageBucket: _env.data.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: _env.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: _env.data.VITE_FIREBASE_APP_ID,
    measurementId: _env.data.VITE_FIREBASE_MEASUREMENT_ID,
  },
  urls: {
    venueOwner: _env.data.VITE_VENUE_OWNER_WEB_URL,
  },
  mocking: {
    enabled: _env.data.VITE_API_MOCKING === 'enabled',
  },
  isDev: _env.data.MODE === 'development',
  isProd: _env.data.MODE === 'production',
  isTest: _env.data.MODE === 'test',
} as const;

