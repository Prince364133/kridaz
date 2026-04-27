import { api } from '@/lib/redux/api';

export const authPasswordApi = api.injectEndpoints({
  endpoints: (builder) => ({
    resetPassword: builder.mutation<void, { token: string; newPassword: string }>({
      query: (credentials) => ({
        url: 'auth/player/reset-password',
        method: 'POST',
        body: credentials,
      }),
    }),
    requestPasswordReset: builder.mutation<void, { email: string }>({
      query: (credentials) => ({
        url: 'auth/player/request-password-reset',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useResetPasswordMutation, useRequestPasswordResetMutation } = authPasswordApi;
