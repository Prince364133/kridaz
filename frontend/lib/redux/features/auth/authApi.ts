import { api } from '@/lib/redux/api';

// Response types for phone OTP login
interface RequestLoginOtpResponse {
  message: string;
  expiresIn?: number;
}

interface UserDto {
  id: string;
  email: string;
  name?: string;
  role?: string;
  // add other fields as needed matching backend UserDto
}

interface VerifyLoginOtpResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Phone verification for authenticated users (keeping existing)
    requestPhoneVerificationOtp: builder.mutation<void, { phoneNumber: string }>({
      query: (data) => ({
        url: 'auth/player/request-phone-verification-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPhoneVerificationOtp: builder.mutation<void, { phoneNumber: string; otp: string }>({
      query: (data) => ({
        url: 'auth/player/verify-phone-verification-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyMfa: builder.mutation<void, { userId: string; code: string }>({
      query: (data) => ({
        url: 'auth/player/verify-mfa',
        method: 'POST',
        body: data,
      }),
    }),

    // NEW: Phone OTP Login endpoints
    requestLoginOtp: builder.mutation<RequestLoginOtpResponse, { phoneNumber: string }>({
      query: (data) => ({
        url: 'auth/player/request-login-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyLoginOtp: builder.mutation<VerifyLoginOtpResponse, { phoneNumber: string; otp: string }>({
      query: (data) => ({
        url: 'auth/player/verify-login-otp',
        method: 'POST',
        body: data,
      }),
    }),
    generateHandoffToken: builder.mutation<{ token: string; nonce: string }, { targetApp: string }>({
      query: (data) => ({
        url: 'auth/player/generate-handoff-token',
        method: 'POST',
        body: data,
      }),
    }),
    // User Profile endpoint for session hydration
    getMe: builder.query<{ user: UserDto }, void>({
        query: () => ({
            url: 'user-management/me',
            method: 'GET',
        }),
        providesTags: ['User'],
    }),

    // --- FIREBASE OTP FLOW ---
    firebaseInitiate: builder.mutation<
      { isNewUser: boolean; sessionToken?: string; user?: VerifyLoginOtpResponse['user']; accessToken?: string; refreshToken?: string },
      { firebaseIdToken: string }
    >({
      query: (data) => ({
        url: 'auth/player/firebase/initiate',
        method: 'POST',
        body: data,
        // CRITICAL: We explicitly omit credentials and the Authorization header 
        // to prevent the backend JWT strategy from authenticating the old stale session
        credentials: 'omit',
        headers: {
          Authorization: '',
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: any) => {
        // The backend returns `{ status: 'NEW_USER' | 'RETURNING_USER' }`
        return {
          ...response,
          isNewUser: response.status === 'NEW_USER',
        };
      },
    }),
    firebaseCompleteProfile: builder.mutation<
      VerifyLoginOtpResponse,
      { sessionToken: string; name?: string; gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'; sportIds?: string[] }
    >({
      query: (data) => ({
        url: 'auth/player/firebase/complete-profile',
        method: 'POST',
        body: data,
      }),
    }),
    getSportsList: builder.query<{ id: string; name: string; iconUrl?: string | null }[], void>({
      query: () => ({
        url: 'auth/player/sports',
        method: 'GET',
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: { sports: any[] }) => response.sports,
    }),
  }),
});

export const { 
  useRequestPhoneVerificationOtpMutation, 
  useVerifyPhoneVerificationOtpMutation, 
  useVerifyMfaMutation,
  // New exports for phone OTP login
  useRequestLoginOtpMutation,
  useVerifyLoginOtpMutation,
  useGenerateHandoffTokenMutation,
  useGetMeQuery,
  // Firebase hooks
  useFirebaseInitiateMutation,
  useFirebaseCompleteProfileMutation,
  useGetSportsListQuery,
} = authApi;
