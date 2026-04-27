import { api } from '@/lib/redux/api';

export interface OnboardingStatus {
  accountId: string;
  hasOwnerIdentity: boolean;
  ownerState: string | null;
  hasDraft: boolean;
  draftCurrentStep: string | null;
  canCreateVenues: boolean;
  completionPercentage: number;
}

export const ownerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardingStatus: builder.query<OnboardingStatus, void>({
      query: () => '/owner/onboarding/status',
      providesTags: ['OnboardingStatus'],
    }),
  }),
});

export const { useGetOnboardingStatusQuery, useLazyGetOnboardingStatusQuery } = ownerApi;
