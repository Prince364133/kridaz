

import { createApi, fetchBaseQuery, BaseQueryFn, FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue, FetchArgs, retry } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '@/lib/utils/tokenStorage';
import { services } from '@/infrastructure/config/services';
import { endpoints } from '@/infrastructure/config/endpoints';
import { normalizeError, type NormalizedError } from '@/infrastructure/interceptors/errorNormalizer';
import { queryTagList } from '@/infrastructure/config/queryTags';
import type { RootState } from '@/lib/store';
import { logout, setCredentials } from '@/lib/redux/features/auth/authSlice'; // Import setCredentials and logout
import { User } from '@/lib/types/auth.types'; // Import User type
import { Mutex } from 'async-mutex';

// Define ApiErrorResponse strictly to match the normalizer
export type ApiErrorResponse = NormalizedError;

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: services.core,
  credentials: 'include',
  timeout: 10000,
  prepareHeaders: (headers) => {
    // Inject request correlation ID (Useful for debugging in backend logs)
    headers.set('x-request-id', crypto.randomUUID());

    const token = tokenStorage.getToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, ApiErrorResponse> = async (args: string | FetchArgs, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions) as QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

  // --- Error Normalization ---
  if (result.error) {
    console.error("API Error intercepted:", result.error);
    const originalError = result.error;
    const normalizedError = normalizeError(originalError);
    
    // --- Token Refresh Logic (401 handling) ---
    if (typeof originalError.status === 'number' && originalError.status === 401) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          console.warn('Unauthorized access - attempting token refresh...');
          const state = api.getState() as RootState;
          const currentToken = state.auth.token;

          if (currentToken) {
             const refreshResult = await baseQuery(
              { url: endpoints.core.auth.refreshToken(), method: 'POST', body: {} },
              api,
              extraOptions
            ) as QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

            if (refreshResult.data) {
              const { accessToken } = refreshResult.data as { accessToken: string };
              // Update Redux and Local Storage
              if (state.auth.user) {
                 api.dispatch(setCredentials({ user: state.auth.user as User, token: accessToken }));
              }
              tokenStorage.setToken(accessToken);
            } else {
              // Refresh failed
              api.dispatch(logout());
              tokenStorage.removeToken();
              return { error: normalizedError }; // Return error, don't retry
            }
          } else {
            api.dispatch(logout());
            tokenStorage.removeToken();
            return { error: normalizedError };
          }
        } catch (err) {
            console.error('Token refresh failed:', err);
            api.dispatch(logout());
            tokenStorage.removeToken();
            return { error: normalizedError };
        } finally {
          release();
        }
      } else {
        // Wait until the mutex is available without locking it
        await mutex.waitForUnlock();
      }

      // Retry the initial query
      result = await baseQuery(args, api, extraOptions) as QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;
      
      // If still error after retry, normalize it
      if (result.error) {
           return { error: normalizeError(result.error) };
      }
      return { data: result.data };
    }
    return { error: normalizedError }; // Return normalized error for non-401 errors
  }

  return { data: result.data };
};

export const api = createApi({
  reducerPath: 'api',
  // Wrapping baseQuery with a simple standard 2-attempt retry policy for idempotencies
  baseQuery: retry(baseQueryWithReauth, { maxRetries: 2 }),
  tagTypes: queryTagList,
  endpoints: () => ({}),
});
