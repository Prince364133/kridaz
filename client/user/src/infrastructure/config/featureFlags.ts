export const featureFlags = {
  enableBatchBooking: false,
  enableSplitPayments: false,
  enableAdvancedReviews: true,
  enableDynamicPricing: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
