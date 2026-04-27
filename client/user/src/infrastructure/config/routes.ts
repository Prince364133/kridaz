export const routes = {
  home: '/',
  login: '/login',
  public: {
    venues: {
      list: '/venues',
      details: (id: string) => `/venues/${id}`,
      checkout: (id: string) => `/venues/${id}/checkout`,
    }
  },
  player: {
    dashboard: '/dashboard',
    bookings: '/bookings',
    profile: '/profile',
  },
  explore: '/explore',
  games: {
    hosted: '/games/my-hosted',
  },
  partner: {
    onboarding: '/partner/onboarding',
    status: '/partner/status',
  }
} as const;
