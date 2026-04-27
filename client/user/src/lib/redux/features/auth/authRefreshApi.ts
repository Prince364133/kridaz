// apps/player-web/lib/redux/features/auth/authRefreshApi.ts
import { api } from '@/lib/redux/api';

interface RefreshTokenResponse {
  accessToken: string;
}

export const authRefreshApi = api.injectEndpoints({
  endpoints: (builder) => ({
    refreshAccessToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: 'auth/player/refresh-token',
        method: 'POST',
      }),
    }),
  }),
});

export const { useRefreshAccessTokenMutation } = authRefreshApi;
