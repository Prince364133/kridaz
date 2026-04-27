export const endpoints = {
  core: {
    auth: {
      refreshToken: () => '/api/user/auth/refresh-token',
      login: () => '/api/user/auth/login',
      signup: () => '/api/user/auth/signup',
    },
    venues: {
      list: () => '/api/user/turf/all',
      details: (id: string) => `/api/user/turf/details/${id}`,
      slots: (turfId: string, date: string) => `/api/user/turf/timeSlot?date=${date}&turfId=${turfId}`,
    },
    bookings: {
      createOrder: () => '/api/user/booking/create-order',
      verifyPayment: () => '/api/user/booking/verify-payment',
      details: (id: string) => `/api/user/booking/details/${id}`,
      initiatePayment: () => '/api/user/booking/initiate-payment',
      cancel: (id: string) => `/api/user/booking/cancel/${id}`,
      participant: (id: string) => `/api/user/booking/participant/${id}`,
      my: () => '/api/user/booking/get-bookings',
    },
    reviews: {
      byVenueId: (venueId: string) => `/api/user/review/all?turfId=${venueId}`,
      create: () => '/api/user/review/add',
    },
  }
} as const;
