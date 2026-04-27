export const queryTags = {
  user: 'User' as const,
  onboardingStatus: 'OnboardingStatus' as const,
  reviews: 'Reviews' as const,
  venues: 'Venues' as const,
  socialConnections: 'SocialConnections' as const,
  userProfile: 'UserProfile' as const,
  venueProfile: 'VenueProfile' as const,
};

export const queryTagList = Object.values(queryTags);
