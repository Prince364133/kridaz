import { z } from 'zod';

// IMPORTANT: Environment variables are critical for application configuration.
//
// 1. Secure Secrets Management:
//    - For production environments, sensitive variables (e.g., database credentials, API keys)
//      should NOT be stored in .env files within version control. Instead, use secure
//      platform-specific mechanisms (e.g., Kubernetes Secrets, AWS Secrets Manager,
//      Vercel/Netlify environment variables) to inject them at runtime.
//
// 2. 'NEXT_PUBLIC_' Prefix Usage:
//    - Only variables strictly needed on the client-side should be prefixed with 'NEXT_PUBLIC_'.
//      Variables without this prefix are server-side only in Next.js.
//    - Avoid accidentally exposing sensitive server-side-only secrets to the client
//      by using 'NEXT_PUBLIC_'.

const envSchema = z.object({
  // The base URL for the primary API backend.
  // In a monolithic backend architecture, all API endpoints (e.g., /auth, /venues)
  // will typically reside under this single base URL.
  NEXT_PUBLIC_API_BASE_URL: z.string().url({ message: "NEXT_PUBLIC_API_BASE_URL must be a valid URL" }),
  
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  // Throwing an error here will prevent the app from building/starting with bad config
  throw new Error('Invalid environment variables');
}

export const config = {
  api: {
    baseUrl: _env.data.NEXT_PUBLIC_API_BASE_URL,
  },
  isDev: _env.data.NODE_ENV === 'development',
  isProd: _env.data.NODE_ENV === 'production',
  isTest: _env.data.NODE_ENV === 'test',
} as const;

