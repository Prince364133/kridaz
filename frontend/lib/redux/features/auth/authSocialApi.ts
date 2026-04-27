import { api } from '@/lib/redux/api';

import { LoginResponse } from './authCoreApi';

export const authSocialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGoogleAuthUrl: builder.query<{ url: string }, void>({
      query: () => 'auth/player/google',
    }),
    googleLogin: builder.mutation<LoginResponse, { code: string }>({
      query: ({ code }) => ({
        url: `auth/player/google/callback?code=${code}`,
        method: 'GET',
      }),
    }),
    linkGoogleAccount: builder.mutation<LoginResponse, { linkingToken: string }>({
      query: (credentials) => ({
        url: 'auth/player/link-google-account',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useGetGoogleAuthUrlQuery, useGoogleLoginMutation, useLinkGoogleAccountMutation } = authSocialApi;
