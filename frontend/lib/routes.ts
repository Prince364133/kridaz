export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    LOGIN_FIREBASE: '/login-firebase',
    LINK_ACCOUNT: '/link-account',
  },
  ACCOUNT: {
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    BOOKINGS: '/my-bookings',
    PERFORMANCE: '/my-performance',
    MY_GAMES: '/my-games',
  },
  PUBLIC: {
    HOME: '/',
    ABOUT: '/about',
    TERMS: '/terms',
    FIND_PLAYERS: '/find-players',
    VENUES: '/venues',
    MARKETPLACE: '/marketplace',
  },
  PARTNER: {
    ONBOARDING: '/partner/onboarding',
    ONBOARDING_STEPS: '/partner/onboarding/steps',
    STATUS: '/partner/status',
  }
} as const;
