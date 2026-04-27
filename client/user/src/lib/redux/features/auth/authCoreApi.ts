import { api } from '@/lib/redux/api';
import { User } from '@/lib/types/auth.types';
import { setCredentials } from './authSlice';
import { tokenStorage } from '@/lib/utils/tokenStorage';

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export const authCoreApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { identifier: string; password: string; rememberMe?: boolean }>({
      query: (credentials) => ({
        url: 'auth/player/login',
        method: 'POST',
        body: credentials,
      }),
      // Example of invalidatesTags: After a successful login, you might want to invalidate
      // tags related to user data, profile, or any data that is user-dependent.
      // This ensures that queries fetching this data are re-run and show up-to-date information.
      // For instance: invalidatesTags: ['User', 'Profile']
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          tokenStorage.setToken(data.accessToken, arg.rememberMe || false);
          dispatch(setCredentials({ user: data.user, token: data.accessToken }));
        } catch {
          // Handle error
        }
      },
    }),
    register: builder.mutation<LoginResponse, { email: string; password: string; name?: string; phone?: string }>({
      query: (userData) => ({
        url: 'auth/player/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authCoreApi;
