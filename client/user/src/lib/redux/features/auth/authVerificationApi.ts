import { api } from '@/lib/redux/api';

export const authVerificationApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    verifyEmail: builder.mutation<void, { token: string }>({
      query: (credentials) => ({
        url: 'auth/player/verify-email',
        method: 'POST',
        body: credentials,
      }),
    }),
    // Verify MFA removed - already defined in authApi
    requestPhoneOtp: builder.mutation<void, { phone: string }>({
      query: (credentials) => ({
        url: 'auth/player/request-phone-verification-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyPhoneOtp: builder.mutation<void, { code: string }>({
      query: (credentials) => ({
        url: 'auth/player/verify-phone-verification-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useVerifyEmailMutation, useRequestPhoneOtpMutation, useVerifyPhoneOtpMutation } = authVerificationApi;
